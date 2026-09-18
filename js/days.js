(function () {
  const State = window.CLIMT_STATE;
  const UI = window.CLIMT_UI;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;

  function daysAgoLabel(daysAgo) {
    if (daysAgo === 0) return 'Сегодня';
    if (daysAgo === 1) return 'Вчера';
    if (daysAgo === 2) return 'Позавчера';
    return daysAgo + ' дня назад';
  }

  function render() {
    const grid = document.getElementById('daysGrid');
    grid.innerHTML = '';

    const cur = State.getCurrentEventDay();
    const playable = State.getPlayableDay();
    const minWindow = Math.max(1, cur - CFG.catchUpWindowDays);

    let stats = { completed: 0, current: 0, catchup: 0, missed: 0 };

    Products.forEach(p => {
      const day = p.day;
      const daysAgo = cur - day;
      const completed = !!State.get().completed[day];
      const wordSolved = State.isWordSolved(day);
      const missed = State.isDayMissed(day);

      let state;
      if (completed) state = 'completed';
      else if (wordSolved) state = 'partial';
      else if (missed) state = 'missed';
      else if (day === playable) state = 'current';
      else if (day > cur) state = 'future';
      else if (day >= minWindow && day <= cur) state = 'catchup';
      else state = 'future';

      stats[state] = (stats[state] || 0) + 1;

      const div = document.createElement('div');
      div.className = 'day day-' + state;

      // Метка-статус в углу
      let markEl = '';
      if (state === 'completed') {
        markEl = '<span class="day-mark check">✓</span>';
      } else if (state === 'missed') {
        markEl = '<span class="day-mark cross">✕</span>';
      } else if (state === 'current') {
        markEl = '<span class="day-mark current-dot"></span>';
      }

      // Визуал в центре
      let visualHtml;
      if (state === 'completed' || state === 'partial' || state === 'missed') {
        visualHtml = `<img class="day-img" src="${p.image}" alt="" onerror="this.style.visibility='hidden'">`;
      } else if (state === 'current') {
        visualHtml = `<div class="day-question">?</div>`;
      } else if (state === 'catchup') {
        visualHtml = `<div class="day-question-small">?</div>`;
      } else {
        visualHtml = `<div class="day-hidden">?</div>`;
      }

      // Нижняя подпись
      let labelText = '';
      if (state === 'completed' || state === 'partial') {
        labelText = p.word;
      } else if (state === 'missed') {
        labelText = 'Пропущен';
      } else if (state === 'current') {
        labelText = daysAgoLabel(daysAgo);
      } else if (state === 'catchup') {
        labelText = daysAgoLabel(daysAgo);
      }

      div.innerHTML = `
        <div class="day-top">
          <span class="day-num">День ${day}</span>
          ${markEl}
        </div>
        <div class="day-visual">${visualHtml}</div>
        ${labelText ? `<div class="day-label">${labelText}</div>` : ''}
      `;

      if (state === 'current' || state === 'partial' || state === 'catchup') {
        div.onclick = () => startDay(day);
      } else if (state === 'completed') {
        div.onclick = () => window.CLIMT_PRODUCT_VIEW.render(p, {
          mode: 'detail',
          promo: State.getPromo(day),
          onBack: () => render(),
        });
      } else if (state === 'missed') {
        div.onclick = () => UI.toast('День ' + day + ' пропущен');
      }

      grid.appendChild(div);
    });

    const done = State.getCompletedCount();
    document.getElementById('progressFill').style.width = (done / CFG.eventDays * 100) + '%';

    // Информационная строка под прогрессом
    let label = `${done} из ${CFG.eventDays} пройдено`;
    if (stats.catchup > 0) label += ` · догнать: ${stats.catchup}`;
    if (stats.missed > 0) label += ` · потеряно: ${stats.missed}`;
    document.getElementById('progressLabel').textContent = label;

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