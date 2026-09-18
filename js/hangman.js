(function () {
  const UI = window.CLIMT_UI;
  let h = null;

  function init(product) {
    h = {
      product,
      word: product.word,
      revealed: new Array(product.word.length).fill(false),
      used: {},
      attempts: 0,
      solved: false,
    };

    document.getElementById('hangEyebrow').textContent = 'День ' + product.day;
    document.getElementById('hangHint').textContent = 'Подсказка: ' + product.hint;

    renderVessel();
    renderWord();
    renderKeyboard();

    UI.show('hang', { onBack: () => window.CLIMT_DAYS.render() });
  }

  function renderVessel() {
    const v = document.getElementById('vessel');
    v.innerHTML = '';
    const n = h.attempts;

    if (n === 0) {
      const d = document.createElement('div');
      d.className = 'drop';
      v.appendChild(d);
      return;
    }

    const MAX_DOTS = 12;
    const shown = Math.min(n, MAX_DOTS);
    for (let i = 0; i < shown; i++) {
      const d = document.createElement('div');
      d.className = 'drop on';
      v.appendChild(d);
    }
    if (n > MAX_DOTS) {
      const more = document.createElement('div');
      more.className = 'drop-more';
      more.textContent = '+' + (n - MAX_DOTS);
      v.appendChild(more);
    }
  }

  function renderWord() {
    const w = document.getElementById('hangWord');
    w.innerHTML = '';
    h.word.split('').forEach((ch, i) => {
      const c = document.createElement('div');
      c.className = 'cell' + (h.revealed[i] ? ' filled' : '');
      c.textContent = h.revealed[i] ? ch : '';
      w.appendChild(c);
    });
  }

  // Раскладка ЙЦУКЕН без Ё — три ряда
  const KB_ROWS = [
    'ЙЦУКЕНГШЩЗХЪ'.split(''),
    'ФЫВАПРОЛДЖЭ'.split(''),
    'ЯЧСМИТЬБЮ'.split(''),
  ];

  function renderKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    KB_ROWS.forEach(letters => {
      const row = document.createElement('div');
      row.className = 'kb-row';
      letters.forEach(L => {
        const b = document.createElement('button');
        b.className = 'key';
        if (h.used[L] === 'hit') b.classList.add('hit', 'used');
        if (h.used[L] === 'miss') b.classList.add('miss', 'used');
        b.textContent = L;
        b.onclick = () => guess(L);
        row.appendChild(b);
      });
      kb.appendChild(row);
    });
  }

  function guess(L) {
    if (!h || h.solved || h.used[L]) return;
    let hit = false;
    for (let i = 0; i < h.word.length; i++) {
      if (h.word[i] === L && !h.revealed[i]) {
        h.revealed[i] = true;
        hit = true;
      }
    }
    h.used[L] = hit ? 'hit' : 'miss';
    if (!hit) h.attempts++;

    renderVessel();
    renderWord();
    renderKeyboard();

    if (h.revealed.every(Boolean)) {
      h.solved = true;
      if (window.CLIMT_STATE && window.CLIMT_STATE.markWordSolved) {
        window.CLIMT_STATE.markWordSolved(h.product.day);
      }
      setTimeout(() => {
        UI.transitionTo('m3', {
          word: h.word,
          label: 'Слово отгадано',
          sub: 'Собираем продукты Climt',
          showOptions: { onBack: () => window.CLIMT_DAYS.render() },
        });
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.CLIMT_MATCH3.init(h.product);
        }));
      }, 450);
    }
  }

  function getState() { return h; }

  function solveAll() {
    if (!h || h.solved) return;
    for (let i = 0; i < h.word.length; i++) h.revealed[i] = true;
    renderVessel();
    renderWord();
    renderKeyboard();
    h.solved = true;
    if (window.CLIMT_STATE && window.CLIMT_STATE.markWordSolved) {
      window.CLIMT_STATE.markWordSolved(h.product.day);
    }
    setTimeout(() => {
      UI.transitionTo('m3', {
        word: h.word,
        label: 'Слово отгадано',
        sub: 'Собираем продукты Climt',
        showOptions: { onBack: () => window.CLIMT_DAYS.render() },
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.CLIMT_MATCH3.init(h.product);
      }));
    }, 300);
  }

  window.CLIMT_HANGMAN = { init, getState, solveAll };
})();