(function () {
  function boot() {
    document.getElementById('cabBtn').onclick = () => window.CLIMT_CABINET.render();

    // CLIMT_HOME.render() сам вызывает UI.show('home', ...) — отдельный show не нужен
    window.CLIMT_HOME.render();

    // Раз в минуту обновляем таймер до следующего дня, если мы на главной
    setInterval(() => {
      if (window.CLIMT_UI.getActiveScreen() === 'home') {
        window.CLIMT_HOME.render();
      }
    }, 60 * 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();