(function () {
  const State = window.CLIMT_STATE;
  const UI = window.CLIMT_UI;
  const CFG = window.CLIMT_CONFIG;
  const Products = window.CLIMT_PRODUCTS;
  let tick = null;

  function render() {
    const cur = State.getCurrentEventDay();
    const product = Products[cur - 1];
    const completed = State.getCompletedCount();

    const eyebrow = document.getElementById('heroEyebrow');
    if (State.isEventComplete()) eyebrow.textContent = 'Событие завершено';
    else if (completed === 0) eyebrow.textContent = 'Событие началось';
    else eyebrow.textContent = 'В процессе';

    document.getElementById('cdDay').textContent = `День ${cur} из ${CFG.eventDays}`;

    const icon = document.getElementById('cdIcon');
    icon.src = product.image;
    icon.alt = product.name;
    icon.onerror = () => { icon.style.display = 'none'; };
    icon.onload = () => { icon.style.display = ''; };

    document.getElementById('cdProgress').style.width =
      (completed / CFG.eventDays * 100) + '%';

    startTick();

    const btn = document.getElementById('startBtn');
    const next = State.getNextPlayableDay();
    if (State.isEventComplete()) {
      btn.textContent = 'Открыть косметичку';
      btn.onclick = () => window.CLIMT_CABINET.render();
    } else if (next) {
      btn.textContent = `Продолжить день ${next}`;
      btn.onclick = () => window.CLIMT_DAYS.startDay(next);
    } else {
      btn.textContent = 'Все доступные дни пройдены';
      btn.onclick = () => window.CLIMT_DAYS.render();
    }

    document.getElementById('daysBtn').onclick = () => window.CLIMT_DAYS.render();

    // ВАЖНО: переключаем экран и задаём onBack (на главной кнопка скрыта)
    UI.show('home', { onBack: () => window.CLIMT_HOME.render() });
  }

  function startTick() {
    clearInterval(tick);
    updateTimer();
    tick = setInterval(updateTimer, 1000);
  }

  function updateTimer() {
    const el = document.getElementById('cdNext');
    if (!el) return;
    const unlockAt = State.getNextDayUnlockDate();
    if (!unlockAt) {
      el.innerHTML = '<strong>Событие завершено</strong>';
      clearInterval(tick);
      return;
    }
    const diff = unlockAt - new Date();
    if (diff <= 0) { render(); return; }
    el.innerHTML = `До нового дня: <strong>${UI.formatCountdown(diff)}</strong>`;
  }

  window.CLIMT_HOME = { render };
})();