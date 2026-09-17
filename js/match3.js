/**
 * Match-3 с фотографиями товаров Climt.
 * Свайп и тап-тап. Свойства x/y/scale/alpha анимируются независимо.
 */
(function () {
  const UI = window.CLIMT_UI;
  const State = window.CLIMT_STATE;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  const N = 6;
  const TILE_TYPES = 5;
  const TARGET_TYPE = 0;

  const SWIPE_THRESHOLD = 0.28;

  const ANIM = {
    swap: 180,
    swapBack: 200,
    clearUp: 130,
    clearOut: 170,
    fall: 300,
  };

  const SCALE = {
    swapPeak: 1.04,
    clearUpPeak: 1.06,
    clearOutEnd: 0.15,
  };

  const imageCache = {};

  function loadImage(path) {
    if (imageCache[path] !== undefined) return Promise.resolve(imageCache[path]);
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { imageCache[path] = img; resolve(img); };
      img.onerror = () => { imageCache[path] = null; resolve(null); };
      img.src = path;
    });
  }

  function pickOtherImages(product) {
    const total = Products.length;
    const startIdx = product.day - 1;
    const others = [];
    const step = Math.floor(total / 5);
    for (let i = 1; i <= total * 2 && others.length < 4; i++) {
      const idx = (startIdx + i * step) % total;
      const p = Products[idx];
      if (p.day === product.day) continue;
      if (others.find(o => o.day === p.day)) continue;
      others.push(p);
    }
    return others;
  }

  let m3 = null;
  let rafId = null;
  let bound = false;

  function init(product) {
    const canvas = document.getElementById('matchCanvas');
    const container = canvas.closest('.scr-body-m3') || canvas.parentElement;

    const cs = getComputedStyle(container);
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

    const availW = container.clientWidth - padX;
    const availH = container.clientHeight - padY;

    if (availW <= 40 || availH <= 40) {
      setTimeout(() => init(product), 50);
      return;
    }

    const size = Math.floor(Math.min(availW, availH, 440));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;

    const cell = size / N;

    const others = pickOtherImages(product);
    const paths = [product.image].concat(others.map(o => o.image));

    m3 = {
      canvas, ctx, size, cell, N,
      grid: [],
      target: product.m3.target,
      moves: product.m3.moves,
      score: 0,
      selected: null,
      selectPhase: 0,
      phase: 'idle',
      busy: false,
      product,
      paths,
      images: [null, null, null, null, null],
      floatLayer: document.getElementById('m3Floats'),
      pointer: null,
    };

    fillGrid();

    paths.forEach((p, i) => {
      loadImage(p).then(img => {
        if (m3 && m3.paths === paths) m3.images[i] = img;
      });
    });

        const taskImg = document.getElementById('m3TaskImg');
    if (taskImg) {
      taskImg.src = product.image;
      taskImg.alt = product.name;
    }
    const wordEl = document.getElementById('m3Word');
    if (wordEl) wordEl.textContent = product.word;
    document.getElementById('m3Score').textContent = '0';
    document.getElementById('m3Target').textContent = product.m3.target;
    document.getElementById('m3Moves').textContent = product.m3.moves;

    if (!bound) { bindInput(); bound = true; }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function fillGrid() {
    const grid = [];
    for (let r = 0; r < N; r++) {
      const row = [];
      for (let c = 0; c < N; c++) {
        let type, guard = 0;
        do {
          type = Math.floor(Math.random() * TILE_TYPES);
          guard++;
        } while (guard < 30 && (
          (c >= 2 && row[c-1].type === type && row[c-2].type === type) ||
          (r >= 2 && grid[r-1][c].type === type && grid[r-2][c].type === type)
        ));
        row.push(makeTile(type, r, c));
      }
      grid.push(row);
    }
    m3.grid = grid;
  }

  function makeTile(type, r, c) {
    return {
      type, r, c,
      x: c, y: r,
      scale: 1, alpha: 1,
      anim: null, // { x: {...}, y: {...}, scale: {...}, alpha: {...} }
    };
  }

  // ============================================================
  // INPUT
  // ============================================================
  function bindInput() {
    const canvas = document.getElementById('matchCanvas');

    const coordsFromEvent = (e) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const cellFromCoords = (x, y) => {
      const c = Math.floor(x / m3.cell);
      const r = Math.floor(y / m3.cell);
      if (r < 0 || r >= N || c < 0 || c >= N) return null;
      return { r, c };
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (!m3 || m3.busy) return;
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}

      const { x, y } = coordsFromEvent(e);
      const cell = cellFromCoords(x, y);
      if (!cell) return;

      m3.pointer = {
        id: e.pointerId,
        startX: x, startY: y,
        startR: cell.r, startC: cell.c,
        moved: false,
      };
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!m3 || !m3.pointer || m3.pointer.id !== e.pointerId || m3.busy) return;
      e.preventDefault();

      const { x, y } = coordsFromEvent(e);
      const dx = x - m3.pointer.startX;
      const dy = y - m3.pointer.startY;
      const threshold = m3.cell * SWIPE_THRESHOLD;

      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      m3.pointer.moved = true;

      let dR = 0, dC = 0;
      if (Math.abs(dx) > Math.abs(dy)) {
        dC = dx > 0 ? 1 : -1;
      } else {
        dR = dy > 0 ? 1 : -1;
      }

      const r0 = m3.pointer.startR;
      const c0 = m3.pointer.startC;
      const r1 = r0 + dR;
      const c1 = c0 + dC;
      if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) {
        m3.pointer = null;
        return;
      }

      const a = m3.grid[r0][c0];
      const b = m3.grid[r1][c1];
      m3.pointer = null;
      m3.selected = null;
      trySwap(a, b);
    });

    const endPointer = (e) => {
      if (!m3 || !m3.pointer || m3.pointer.id !== e.pointerId) return;
      const ptr = m3.pointer;
      m3.pointer = null;
      if (m3.busy) return;
      if (!ptr.moved) handleTap(ptr.startR, ptr.startC);
    };

    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
  }

  function handleTap(r, c) {
    if (!m3 || m3.busy) return;
    const sel = m3.selected;

    if (!sel) {
      m3.selected = { r, c };
      m3.selectPhase = 0;
      return;
    }
    if (sel.r === r && sel.c === c) {
      m3.selected = null;
      return;
    }
    const dr = Math.abs(sel.r - r), dc = Math.abs(sel.c - c);
    if (dr + dc !== 1) {
      m3.selected = { r, c };
      m3.selectPhase = 0;
      return;
    }
    const a = m3.grid[sel.r][sel.c];
    const b = m3.grid[r][c];
    m3.selected = null;
    trySwap(a, b);
  }

  // ============================================================
  // TWEEN SYSTEM — независимые каналы свойств
  // ============================================================
  function tween(tile, props, duration) {
    if (!tile) return;
    const now = performance.now();
    if (!tile.anim) tile.anim = {};
    for (const key in props) {
      const to = props[key];
      const from = tile[key];
      if (from === to) {
        tile[key] = to;
        delete tile.anim[key];
        continue;
      }
      tile.anim[key] = {
        from, to,
        start: now,
        duration,
      };
    }
  }

  function easeInOutCubic(k) {
    return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  }

  function updateTile(tile, now) {
    if (!tile || !tile.anim) return;
    let any = false;
    for (const key in tile.anim) {
      const a = tile.anim[key];
      let k = (now - a.start) / a.duration;
      if (k >= 1) {
        // ЖЁСТКАЯ фиксация в конечном значении
        tile[key] = a.to;
        delete tile.anim[key];
      } else {
        tile[key] = a.from + (a.to - a.from) * easeInOutCubic(k);
        any = true;
      }
    }
    if (!any) tile.anim = null;
  }

  // ============================================================
  // SWAP
  // ============================================================
  function trySwap(a, b) {
    if (!a || !b) return;
    m3.busy = true;
    m3.phase = 'swapping';

    // Один tween — координаты + лёгкий scale
    tween(a, { x: b.x, y: b.y, scale: SCALE.swapPeak }, ANIM.swap);
    tween(b, { x: a.x, y: a.y, scale: SCALE.swapPeak }, ANIM.swap);

    // Параллельно (не перезаписывая x/y!) сбрасываем scale
    setTimeout(() => {
      if (!m3) return;
      tween(a, { scale: 1 }, ANIM.swap * 0.5);
      tween(b, { scale: 1 }, ANIM.swap * 0.5);
    }, ANIM.swap * 0.55);

    // Меняем логические места в сетке
    swapInGrid(a, b);

    setTimeout(() => {
      if (!m3) return;
      if (findMatches().length === 0) {
        // Откат
        swapInGrid(a, b);
        tween(a, { x: a.c, y: a.r, scale: 1 }, ANIM.swapBack);
        tween(b, { x: b.c, y: b.r, scale: 1 }, ANIM.swapBack);
        setTimeout(() => {
          if (!m3) return;
          snapTile(a); snapTile(b);
          m3.busy = false;
          m3.phase = 'idle';
          UI.toast('Нет совпадений');
        }, ANIM.swapBack + 20);
        return;
      }
      m3.moves--;
      updateHeader();
      resolveMatches();
    }, ANIM.swap + 30);
  }

  function snapTile(t) {
    if (!t) return;
    t.x = t.c;
    t.y = t.r;
    t.scale = 1;
    t.alpha = 1;
    t.anim = null;
  }

  function swapInGrid(a, b) {
    const g = m3.grid;
    g[a.r][a.c] = b;
    g[b.r][b.c] = a;
    const ar = a.r, ac = a.c;
    a.r = b.r; a.c = b.c;
    b.r = ar; b.c = ac;
  }

  // ============================================================
  // LOOP
  // ============================================================
  function loop() {
    if (!m3) return;
    const now = performance.now();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      updateTile(m3.grid[r][c], now);
    }
    m3.selectPhase += 0.08;
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // ============================================================
  // DRAW
  // ============================================================
  function draw() {
    const { ctx, size, cell, grid } = m3;
    ctx.clearRect(0, 0, size, size);

    // CLIP по границам поля
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.clip();

    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      drawTile(ctx, grid[r][c], cell);
    }

    if (m3.selected) {
      const { r, c } = m3.selected;
      const pulse = 1 + Math.sin(m3.selectPhase) * 0.02;
      const cx = c * cell + cell / 2;
      const cy = r * cell + cell / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      ctx.translate(-cx, -cy);

      ctx.strokeStyle = 'rgba(184,146,74,.35)';
      ctx.lineWidth = 6;
      roundRect(ctx, c*cell + 5, r*cell + 5, cell - 10, cell - 10, cell * 0.18);
      ctx.stroke();

      ctx.strokeStyle = '#1A1A1A';
      ctx.lineWidth = 2;
      roundRect(ctx, c*cell + 4, r*cell + 4, cell - 8, cell - 8, cell * 0.18);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawTile(ctx, tile, cell) {
    if (!tile || tile.alpha <= 0.01 || tile.scale <= 0.01) return;

    const pad = cell * 0.055;
    const sz = cell - pad * 2;
    const isTarget = tile.type === TARGET_TYPE;

    // Экранный центр
    const cx = tile.x * cell + cell / 2;
    const cy = tile.y * cell + cell / 2;

    ctx.save();
    ctx.globalAlpha = tile.alpha;

    ctx.translate(cx, cy);
    ctx.scale(tile.scale, tile.scale);
    ctx.translate(-cx, -cy);

    const x = tile.x * cell;
    const y = tile.y * cell;
    const radius = sz * 0.2;

    ctx.shadowColor = 'rgba(26,26,26,.07)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    if (isTarget) {
      const grad = ctx.createLinearGradient(x, y, x + cell, y + cell);
      grad.addColorStop(0, '#FCF9F3');
      grad.addColorStop(1, '#F5EEDF');
      ctx.fillStyle = grad;
      roundRect(ctx, x + pad, y + pad, sz, sz, radius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = '#B8924A';
      ctx.lineWidth = 1.5;
      roundRect(ctx, x + pad + 0.75, y + pad + 0.75, sz - 1.5, sz - 1.5, radius);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, x + pad, y + pad, sz, sz, radius);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      ctx.strokeStyle = '#E5E5E1';
      ctx.lineWidth = 1;
      roundRect(ctx, x + pad + 0.5, y + pad + 0.5, sz - 1, sz - 1, radius);
      ctx.stroke();
    }

    const iconSize = sz * (isTarget ? 0.72 : 0.64);
    const img = m3.images[tile.type];
    if (img) {
      ctx.drawImage(
        img,
        Math.round(cx - iconSize / 2),
        Math.round(cy - iconSize / 2),
        Math.round(iconSize),
        Math.round(iconSize)
      );
    } else {
      ctx.fillStyle = '#E8E8E4';
      ctx.beginPath();
      ctx.arc(cx, cy, iconSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ============================================================
  // MATCH LOGIC
  // ============================================================
  function findMatches() {
    const g = m3.grid, out = new Set();
    for (let r = 0; r < N; r++) {
      let run = 1;
      for (let c = 1; c <= N; c++) {
        if (c < N && g[r][c] && g[r][c-1] && g[r][c].type === g[r][c-1].type) run++;
        else {
          if (run >= 3) for (let k = c - run; k < c; k++) out.add(r + ':' + k);
          run = 1;
        }
      }
    }
    for (let c = 0; c < N; c++) {
      let run = 1;
      for (let r = 1; r <= N; r++) {
        if (r < N && g[r][c] && g[r-1][c] && g[r][c].type === g[r-1][c].type) run++;
        else {
          if (run >= 3) for (let k = r - run; k < r; k++) out.add(k + ':' + c);
          run = 1;
        }
      }
    }
    return [...out].map(s => {
      const [rr, cc] = s.split(':').map(Number);
      return { r: rr, c: cc };
    });
  }

  function groupMatches(cells) {
    const set = new Set(cells.map(c => c.r + ':' + c.c));
    const seen = new Set();
    const groups = [];
    cells.forEach(({ r, c }) => {
      const key = r + ':' + c;
      if (seen.has(key)) return;
      const group = [];
      const stack = [[r, c]];
      while (stack.length) {
        const [rr, cc] = stack.pop();
        const k = rr + ':' + cc;
        if (seen.has(k)) continue;
        seen.add(k); group.push({ r: rr, c: cc });
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
          const nr = rr + dr, nc = cc + dc, nk = nr + ':' + nc;
          if (set.has(nk) && !seen.has(nk)) stack.push([nr, nc]);
        });
      }
      groups.push(group);
    });
    return groups;
  }

  function resolveMatches() {
    if (!m3) return;
    m3.phase = 'clearing';
    const matches = findMatches();
    if (matches.length === 0) {
      m3.phase = 'idle';
      m3.busy = false;
      checkEnd();
      return;
    }

    const groups = groupMatches(matches);
    let targetHits = 0;

    groups.forEach(group => {
      const hasTarget = group.some(({ r, c }) => m3.grid[r][c].type === TARGET_TYPE);
      if (hasTarget) {
        targetHits++;
        const mid = group[Math.floor(group.length / 2)];
        showFloat(mid.r, mid.c, '+1');
      }
    });

    if (targetHits > 0) {
      m3.score = Math.min(m3.target, m3.score + targetHits);
      updateHeader();
    }

    // Фаза 1: лёгкое сжатие
    matches.forEach(({ r, c }) => {
      const t = m3.grid[r][c];
      if (t) tween(t, { scale: SCALE.clearUpPeak }, ANIM.clearUp);
    });

    // Фаза 2: уменьшение + прозрачность
    setTimeout(() => {
      if (!m3) return;
      matches.forEach(({ r, c }) => {
        const t = m3.grid[r][c];
        if (t) tween(t, { scale: SCALE.clearOutEnd, alpha: 0 }, ANIM.clearOut);
      });
    }, ANIM.clearUp);

    // Фаза 3: удаление + гравитация
    setTimeout(() => {
      if (!m3) return;
      matches.forEach(({ r, c }) => {
        m3.grid[r][c] = null;
      });
      applyGravity();
      setTimeout(() => resolveMatches(), ANIM.fall + 40);
    }, ANIM.clearUp + ANIM.clearOut);
  }

  function showFloat(r, c, text) {
    const el = document.createElement('div');
    el.className = 'float-score';
    el.textContent = text;
    el.style.left = (c * m3.cell + m3.cell / 2) + 'px';
    el.style.top = (r * m3.cell + m3.cell / 2) + 'px';
    m3.floatLayer.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function applyGravity() {
    const g = m3.grid;
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        if (g[r][c]) {
          if (write !== r) {
            g[write][c] = g[r][c];
            g[r][c] = null;
            g[write][c].r = write;
            g[write][c].c = c;
            tween(g[write][c], { x: c, y: write }, ANIM.fall);
          }
          write--;
        }
      }
      for (let r = write; r >= 0; r--) {
        const type = Math.floor(Math.random() * TILE_TYPES);
        const t = makeTile(type, r, c);
        // Стартует ровно над полем на своей колонке
        t.x = c;
        t.y = r - (write + 1);
        t.alpha = 1;
        t.scale = 1;
        tween(t, { x: c, y: r }, ANIM.fall);
        g[r][c] = t;
      }
    }
    m3.phase = 'falling';
  }

  function updateHeader() {
    if (!m3) return;
    document.getElementById('m3Score').textContent = m3.score;
    document.getElementById('m3Moves').textContent = m3.moves;
  }

  function checkEnd() {
    if (!m3) return;
    if (m3.score >= m3.target) {
      setTimeout(finish, 400);
    } else if (m3.moves <= 0) {
      m3.moves = 6;
      updateHeader();
      UI.toast('Ещё 6 ходов — доведи до конца');
    }
  }

  function finish() {
    if (!m3) return;
    const product = m3.product;
    const discount = CFG.discountPerDay;
    const code = `CLIMT-${product.word}-${discount}`;
    State.completeDay(product.day, code);
    cancelAnimationFrame(rafId);
    m3 = null;

    UI.transitionTo('product', {
      word: '✓',
      label: 'Собрано',
      sub: 'Открываем карточку товара',
      showOptions: { onBack: () => window.CLIMT_DAYS.render() },
    });
    setTimeout(() => {
      window.CLIMT_PRODUCT_VIEW.render(product, {
        mode: 'reward',
        promo: code,
        onBack: () => window.CLIMT_DAYS.render(),
      });
    }, 700);
  }

  function getState() { return m3; }
  function winNow() {
    if (!m3) return;
    m3.score = m3.target;
    updateHeader();
    setTimeout(finish, 250);
  }

  window.CLIMT_MATCH3 = { init, winNow, getState };
})();