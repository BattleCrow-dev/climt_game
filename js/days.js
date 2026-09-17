(function () {
  const State = window.CLIMT_STATE;
  const UI = window.CLIMT_UI;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function render() {
    const grid = document.getElementById('daysGrid');
    grid.innerHTML = '';
    const curDay = State.getCurrentEventDay();
    const next = State.getNextPlayableDay();

    Products.forEach(p => {
      const done = !!State.get().completed[p.day];
      const dateLocked = p.day > curDay;
      const locked = !done && (dateLocked || p.day !== next);

      const div = document.createElement('div');
      div.className = 'day'
        + (done ? ' done' : '')
        + (locked ? ' locked' : '')
        + (p.day === next && !done ? ' current' : '');

      div.innerHTML = `
        <div class="day-num">День ${p.day}</div>
        <img class="day-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">
        ${done ? '<div class="check">✓</div>' : ''}
      `;

      if (!locked) div.onclick = () => startDay(p.day);
      grid.appendChild(div);
    });

    const done = State.getCompletedCount();
    document.getElementById('progressFill').style.width = (done / CFG.eventDays * 100) + '%';
    document.getElementById('progressLabel').textContent = `${done} из ${CFG.eventDays} пройдено`;

    UI.show('days', { onBack: () => window.CLIMT_HOME.render() });
  }

  function startDay(day) {
    const p = Products.find(x => x.day === day);
    if (!p) return;

    // День уже пройден — показываем карточку товара
    if (State.get().completed[day]) {
      window.CLIMT_PRODUCT_VIEW.render(p, {
        mode: 'detail',
        promo: State.getPromo(day),
        onBack: () => render(),
      });
      return;
    }

    // Слово уже отгадано ранее — пропускаем виселицу, сразу в Match-3
    if (State.isWordSolved(day)) {
      UI.show('m3', { onBack: () => render() });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        window.CLIMT_MATCH3.init(p);
      }));
      return;
    }

    // Иначе — начинаем с виселицы
    window.CLIMT_HANGMAN.init(p);
  }

  window.CLIMT_DAYS = { render, startDay };
})();