(function () {
  function boot() {
    document.getElementById('cabBtn').onclick = () => window.CLIMT_CABINET.render();

    const logo = document.getElementById('brandLogo');
    if (logo) {
      logo.onclick = (e) => {
        e.preventDefault();
        window.CLIMT_HOME.render();
      };
    }

    // Первый вход – онбординг, иначе сразу главная
    if (window.CLIMT_ONBOARDING && window.CLIMT_ONBOARDING.shouldShow()) {
      window.CLIMT_ONBOARDING.show();
    } else {
      window.CLIMT_HOME.render();
    }

    // Обновление таймера на главной
    setInterval(() => {
      if (window.CLIMT_UI.getActiveScreen() === 'home') {
        window.CLIMT_HOME.render();
      }
    }, 60 * 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();