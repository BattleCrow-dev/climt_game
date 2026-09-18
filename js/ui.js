(function () {
  const SCREENS = ['home', 'days', 'hang', 'm3', 'product', 'cab', 'onboard'];
  const FIT_SCREENS = ['home', 'days', 'hang', 'onboard'];
  let backHandler = null;

  function show(name, options) {
    options = options || {};
    SCREENS.forEach(s => {
      const el = document.getElementById('scr-' + s);
      if (el) el.classList.toggle('active', s === name);
    });
    document.body.classList.toggle('screen-fit', FIT_SCREENS.indexOf(name) !== -1);
    const backBtn = document.getElementById('backBtn');
    backBtn.style.visibility = (name === 'home' || name === 'onboard') ? 'hidden' : 'visible';
    backHandler = options.onBack || null;
    document.querySelectorAll('.scr-body').forEach(el => { el.scrollTop = 0; });
    window.scrollTo(0, 0);
  }

  function getActiveScreen() {
    return SCREENS.find(s => {
      const el = document.getElementById('scr-' + s);
      return el && el.classList.contains('active');
    });
  }

  let toastTimer = null;
  function toast(msg, duration) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), duration || 2000);
  }

  function copyText(text) {
    return new Promise(resolve => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => resolve(true)).catch(() => resolve(fallbackCopy(text)));
      } else {
        resolve(fallbackCopy(text));
      }
    });
  }
  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  }

  function formatCountdown(ms) {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  }

  function plural(n, forms) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
    return forms[2];
  }

  function transitionTo(screenName, options) {
    options = options || {};
    const overlay = document.getElementById('transitionOverlay');
    const wordEl = document.getElementById('transitionWord');
    const labelEl = document.getElementById('transitionLabel');
    const subEl = document.getElementById('transitionSub');

    if (options.word) wordEl.textContent = options.word;
    labelEl.textContent = options.label || 'Слово отгадано';
    subEl.textContent = options.sub || 'Собираем сеты Climt';

    overlay.classList.add('active');
    setTimeout(() => {
      show(screenName, options.showOptions);
      overlay.classList.remove('active');
    }, 1100);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('backBtn').addEventListener('click', () => {
      if (typeof backHandler === 'function') backHandler();
      else show('home');
    });
  });

  window.CLIMT_UI = {
    show, getActiveScreen, toast, copyText,
    formatCountdown, plural, transitionTo,
  };
})();