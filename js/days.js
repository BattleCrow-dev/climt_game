(function () {
  const State = window.CLIMT_STATE;
  const UI = window.CLIMT_UI;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function render() {
    const grid = document.getElementById('daysGrid');
    grid.innerHTML = '';

    const cur = State.getCurrentEventDay();
    const playable = State.getPlayableDay();
    const minWindow = Math.max(1, cur - CFG.catchUpWindowDays);

    Products.forEach(p => {
      const day = p.day;
      const completed = !!State.get().completed[day];
      const wordSolved = State.isWordSolved(day);
      const missed = State.isDayMissed(day);

      let state;
      if (completed) state = 'completed';
      else if (wordSolved) state = 'partial';
      else if (missed) state = 'missed';
      else if (day === playable) state = 'playable';
      else if (day > cur) state = 'future';
      else if (day >= minWindow && day <= cur) state = 'locked';
      else state = 'future';

      const div = document.createElement('div');
      div.className = 'day day-' + state;

      let inner = `<div class="day-num">${day}</div>`;

      if (state === 'completed' || state === 'partial') {
        inner += `
          <img class="day-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
          <div class="day-name">${p.word}</div>
        `;
        if (state === 'completed') {
          inner += `<div class="day-mark check">✓</div>`;
        }
      } else if (state === 'missed') {
        inner += `
          <img class="day-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
          <div class="day-name">${p.word}</div>
          <div class="day-mark cross">✕</div>
        `;
      } else if (state === 'playable') {
        inner += `<div class="day-question">?</div>`;
      } else {
        inner += `<div class="day-hidden">?</div>`;
      }

      div.innerHTML = inner;

      if (state === 'playable' || state === 'partial') {
        div.onclick = () => startDay(day);
      } else if (state === 'completed') {
        div.onclick = () => window.CLIMT_PRODUCT_VIEW.render(p, {
          mode: 'detail',
          promo: State.getPromo(day),
          onBack: () => render(),
        });
      } else if (state === 'missed') {
        div.onclick = () => UI.toast('Этот день пропущен');
      }

      grid.appendChild(div);
    });

    const done = State.getCompletedCount();
    document.getElementById('progressFill').style.width = (done / CFG.eventDays * 100) + '%';
    document.getElementById('progressLabel').textContent =
      `${done} из ${CFG.eventDays} пройдено`;

    UI.show('days', { onBack: () => window.CLIMT_HOME.render() });
  }

  function startDay(day) {
    const p = Products.find(x => x.day === day);
    if (!p) return;

    if (State.get().completed[day]) {
      window.CLIMT_PRODUCT_VIEW.render(p, {
        mode: 'detail',
        promo: State.getPromo(day),
        onBack: () => render(),
      });
      return;
    }

    if (State.isDayMissed(day)) {
      UI.toast('Этот день уже пропущен');
      return;
    }

    const playable = State.getPlayableDay();
    if (day !== playable && !State.isWordSolved(day)) {
      UI.toast('Сначала пройди день ' + playable);
      return;
    }

    if (State.isWordSolved(day)) {
      UI.show('m3', { onBack: () => render() });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.CLIMT_MATCH3.init(p);
      }));
      return;
    }

    window.CLIMT_HANGMAN.init(p);
  }

  window.CLIMT_DAYS = { render, startDay };
})();