(function () {
  const UI = window.CLIMT_UI;
  const RUS = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'.split('');
  let h = null;

  function init(product) {
    h = {
      product,
      word: product.word,
      revealed: new Array(product.word.length).fill(false),
      used: {},
      attempts: 6,
      maxAttempts: 6,
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
    const filled = h.maxAttempts - h.attempts;
    for (let i = 0; i < h.maxAttempts; i++) {
      const d = document.createElement('div');
      d.className = 'drop' + (i < filled ? ' on' : '');
      v.appendChild(d);
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

  function renderKeyboard() {
    const kb = document.getElementById('keyboard');
    kb.innerHTML = '';
    RUS.forEach(L => {
      const b = document.createElement('button');
      b.className = 'key';
      if (h.used[L] === 'hit') b.classList.add('hit', 'used');
      if (h.used[L] === 'miss') b.classList.add('miss', 'used');
      b.textContent = L;
      b.onclick = () => guess(L);
      kb.appendChild(b);
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
    if (!hit) {
      h.attempts--;
      if (h.attempts <= 0) forceReveal();
    }
    renderVessel(); renderWord(); renderKeyboard();

    if (h.revealed.every(Boolean)) {
      h.solved = true;
      if (window.CLIMT_STATE && window.CLIMT_STATE.markWordSolved) {
        window.CLIMT_STATE.markWordSolved(h.product.day);
      }

      setTimeout(() => {
        UI.transitionTo('m3', {
          word: h.word,
          label: 'Слово отгадано',
          sub: 'Собираем тройки',
          showOptions: { onBack: () => window.CLIMT_DAYS.render() },
        });
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.CLIMT_MATCH3.init(h.product);
        }));
      }, 450);
    }
  }

  function forceReveal() {
    for (let i = 0; i < h.word.length; i++) {
      if (!h.revealed[i]) { h.revealed[i] = true; break; }
    }
    h.attempts = 2;
    UI.toast('Открыта подсказка');
  }

  // ============================================================
  // ADMIN API
  // ============================================================
  function getState() { return h; }

  function solveAll() {
    if (!h || h.solved) return;
    for (let i = 0; i < h.word.length; i++) h.revealed[i] = true;
    h.used = h.used || {};
    renderVessel(); renderWord(); renderKeyboard();
    h.solved = true;

    if (window.CLIMT_STATE && window.CLIMT_STATE.markWordSolved) {
      window.CLIMT_STATE.markWordSolved(h.product.day);
    }

    setTimeout(() => {
      UI.transitionTo('m3', {
        word: h.word,
        label: 'Слово отгадано',
        sub: 'Собираем тройки',
        showOptions: { onBack: () => window.CLIMT_DAYS.render() },
      });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.CLIMT_MATCH3.init(h.product);
      }));
    }, 300);
  }

  window.CLIMT_HANGMAN = { init, getState, solveAll };
})();