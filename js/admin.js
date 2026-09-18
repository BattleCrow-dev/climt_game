/**
 * Админ-панель.
 * Открытие: ?admin=1 в URL, клик по шестерёнке или Ctrl+Shift+A.
 * Требует пароль (см. CLIMT_CONFIG.adminPassword).
 */
(function () {
  const ACTIVATION = {
    urlParam: 'admin',
    hotkey: { key: 'A' },
    sessionKey: 'climt_admin_auth',
  };

  let panelEl = null;
  let btnEl = null;
  let isOpen = false;
  let jsonOpen = false;
  let authorized = false;

  function isAdminRequested() {
    const params = new URLSearchParams(window.location.search);
    return params.get(ACTIVATION.urlParam) === '1';
  }

  function checkHotkey(e) {
    return (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toUpperCase() === ACTIVATION.hotkey.key;
  }

  function isAuthorized() {
    if (authorized) return true;
    try {
      if (sessionStorage.getItem(ACTIVATION.sessionKey) === '1') {
        authorized = true;
        return true;
      }
    } catch (e) {}
    return false;
  }

  function requestPassword() {
    const expected = window.CLIMT_CONFIG.adminPassword || 'admin';
    const entered = window.prompt('Введите пароль администратора:');
    if (entered === null) return false;
    if (entered === expected) {
      authorized = true;
      try { sessionStorage.setItem(ACTIVATION.sessionKey, '1'); } catch (e) {}
      return true;
    }
    alert('Неверный пароль');
    return false;
  }

  function tryOpen() {
    if (!isAuthorized() && !requestPassword()) return;
    isOpen = true;
    panelEl.classList.add('open');
    renderPanel();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .adm-btn {
        position: fixed; bottom: 18px; right: 18px; z-index: 9999;
        width: 44px; height: 44px; border-radius: 50%;
        background: #0A0A0A; color: #fff;
        border: none; cursor: pointer;
        font-size: 18px; line-height: 1;
        box-shadow: 0 6px 20px rgba(0,0,0,.25);
        transition: transform .2s;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .adm-btn:hover { transform: scale(1.06); }
      .adm-btn:active { transform: scale(.96); }

      .adm-panel {
        position: fixed; top: 0; right: 0; bottom: 0;
        width: 400px; max-width: 100vw;
        background: #0E0E0E; color: #E8E8E8;
        z-index: 9998;
        overflow-y: auto;
        box-shadow: -8px 0 32px rgba(0,0,0,.4);
        transform: translateX(100%);
        transition: transform .3s cubic-bezier(.22,.8,.24,1);
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 12.5px;
        line-height: 1.5;
      }
      .adm-panel.open { transform: translateX(0); }
      .adm-panel::-webkit-scrollbar { width: 6px; }
      .adm-panel::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 3px; }

      .adm-head {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid #222;
        position: sticky; top: 0; background: #0E0E0E; z-index: 2;
      }
      .adm-head h2 {
        font-size: 11px; letter-spacing: .16em; text-transform: uppercase;
        color: #A88850; margin: 0; font-weight: 700;
      }
      .adm-close {
        background: none; border: 1px solid #2a2a2a; color: #888;
        width: 26px; height: 26px; border-radius: 6px;
        cursor: pointer; font-size: 13px; font-family: inherit;
        display: flex; align-items: center; justify-content: center;
      }
      .adm-close:hover { border-color: #A88850; color: #A88850; }

      .adm-sec { padding: 14px 18px; border-bottom: 1px solid #1a1a1a; }
      .adm-sec-title {
        font-size: 9.5px; letter-spacing: .18em; text-transform: uppercase;
        color: #666; margin: 0 0 10px; font-weight: 700;
      }

      .adm-status {
        display: grid; gap: 4px;
        font-size: 11.5px; color: #B0B0B0;
      }
      .adm-status div { display: flex; justify-content: space-between; gap: 12px; }
      .adm-status span:first-child { color: #666; }
      .adm-status span:last-child { color: #E8E8E8; font-weight: 600; }
      .adm-status .gold { color: #A88850; }

      .adm-grid-7 { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
      .adm-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
      .adm-grid-1 { display: grid; grid-template-columns: 1fr; gap: 6px; }

      .adm-day {
        aspect-ratio: 1;
        background: #161616; border: 1px solid #222;
        border-radius: 6px; color: #888;
        cursor: pointer; font-size: 11px; font-weight: 700;
        display: flex; align-items: center; justify-content: center;
        font-family: inherit; transition: all .15s;
      }
      .adm-day:hover { background: #1e1e1e; border-color: #A88850; color: #E8E8E8; }
      .adm-day.done { background: #1A2A1A; border-color: #3A5A3A; color: #7ACA7A; }
      .adm-day.missed { background: #1A1414; border-color: #3A1818; color: #8A5555; }
      .adm-day.current { border-color: #A88850; color: #A88850; }

      .adm-btn-sm {
        background: #161616; color: #D0D0D0;
        border: 1px solid #222;
        padding: 8px 10px; border-radius: 6px;
        cursor: pointer; font-size: 11.5px;
        font-family: inherit; text-align: center;
        transition: all .15s;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .adm-btn-sm:hover { background: #1e1e1e; border-color: #A88850; color: #fff; }
      .adm-btn-sm:active { transform: scale(.97); }
      .adm-btn-sm.primary { background: #A88850; color: #0E0E0E; border-color: #A88850; font-weight: 700; }
      .adm-btn-sm.primary:hover { background: #C0A060; }
      .adm-btn-sm.danger { background: #221010; border-color: #3A1818; color: #D08080; }
      .adm-btn-sm.danger:hover { background: #2a1414; border-color: #6a2a2a; }

      .adm-row { display: flex; align-items: center; gap: 6px; }
      .adm-row input[type="number"] {
        flex: 1;
        background: #060606; color: #E8E8E8;
        border: 1px solid #222; border-radius: 6px;
        padding: 8px 10px; font-family: inherit; font-size: 12px;
        min-width: 0; box-sizing: border-box;
      }
      .adm-row input[type="number"]:focus { outline: none; border-color: #A88850; }

      .adm-json-toggle {
        display: flex; align-items: center; justify-content: space-between;
        cursor: pointer; user-select: none;
      }
      .adm-json-toggle:hover .adm-sec-title { color: #A88850; }

      .adm-textarea {
        width: 100%; min-height: 200px;
        background: #060606; border: 1px solid #1a1a1a;
        border-radius: 6px; color: #A0A0A0;
        font-family: inherit; font-size: 10.5px; line-height: 1.5;
        padding: 10px; resize: vertical; box-sizing: border-box; margin-top: 8px;
      }
      .adm-textarea:focus { outline: none; border-color: #A88850; color: #E8E8E8; }

      .adm-toast {
        position: fixed; bottom: 76px; right: 18px;
        background: #0A0A0A; color: #fff;
        padding: 10px 16px; border-radius: 8px;
        font-size: 12px; font-family: -apple-system, sans-serif;
        z-index: 10000;
        box-shadow: 0 8px 24px rgba(0,0,0,.5);
        border: 1px solid #2a2a2a;
        opacity: 0; transform: translateY(10px);
        transition: all .25s; pointer-events: none;
        max-width: 300px;
      }
      .adm-toast.show { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);
  }

  let toastTimer = null;
  function toast(msg) {
    let el = document.getElementById('admToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'admToast';
      el.className = 'adm-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  function buildUI() {
    btnEl = document.createElement('button');
    btnEl.className = 'adm-btn';
    btnEl.textContent = '⚙';
    btnEl.title = 'Админ-панель';
    btnEl.onclick = () => {
      if (isOpen) { isOpen = false; panelEl.classList.remove('open'); return; }
      tryOpen();
    };
    document.body.appendChild(btnEl);

    panelEl = document.createElement('div');
    panelEl.className = 'adm-panel';
    panelEl.id = 'admPanel';
    document.body.appendChild(panelEl);
  }

  function closePanel() {
    isOpen = false;
    panelEl.classList.remove('open');
  }

  function renderPanel() {
    const S = window.CLIMT_STATE;
    const CFG = window.CLIMT_CONFIG;
    const Products = window.CLIMT_PRODUCTS;

    const cur = S.getCurrentEventDay();
    const playable = S.getPlayableDay();
    const doneCount = S.getCompletedCount();
    const isComplete = S.isEventComplete();
    const activeScreen = safeGetScreen();
    const startDate = new Date(S.get().startDate);
    const marketplace = S.getMarketplace();
    const missed = S.getMissedDays();

    const startLabel = isNaN(startDate.getTime())
      ? '–'
      : startDate.toLocaleDateString('ru-RU') + ' ' +
        startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    panelEl.innerHTML = `
      <div class="adm-head">
        <h2>Админ-панель</h2>
        <button class="adm-close" id="admClose">✕</button>
      </div>

      <div class="adm-sec">
        <div class="adm-status">
          <div><span>Экран</span><span>${activeScreen}</span></div>
          <div><span>День</span><span class="gold">${cur} / ${CFG.eventDays}</span></div>
          <div><span>Играбельный</span><span>${playable ?? '–'}</span></div>
          <div><span>Пропущено</span><span>${missed.length ? missed.join(', ') : '–'}</span></div>
          <div><span>Пройдено</span><span>${doneCount} / ${CFG.eventDays}</span></div>
          <div><span>Маркетплейс</span><span>${marketplace || 'не выбран'}</span></div>
          <div><span>Старт</span><span>${startLabel}</span></div>
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Управление датой старта</div>
        <div class="adm-grid-4" style="margin-bottom:8px">
          <button class="adm-btn-sm" data-shift="-7">− 7 дн</button>
          <button class="adm-btn-sm" data-shift="-1">− 1 дн</button>
          <button class="adm-btn-sm" data-shift="1">+ 1 дн</button>
          <button class="adm-btn-sm" data-shift="7">+ 7 дн</button>
        </div>
        <div class="adm-row">
          <input type="number" id="admDayInput" value="${cur}" min="1" max="${CFG.eventDays}">
          <button class="adm-btn-sm primary" id="admSetDay" style="flex:0 0 auto">День N</button>
        </div>
        <div style="color:#666; font-size:10.5px; margin-top:6px; line-height:1.4">
          Сдвиг старта назад = сегодня становится днём N+1.
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Перейти к дню (сброс и заново)</div>
        <div class="adm-grid-7">
          ${Products.map(p => {
            const isDone = !!S.get().completed[p.day];
            const isMissed = S.isDayMissed(p.day);
            const isCur = p.day === cur;
            return `<button class="adm-day${isDone?' done':''}${isMissed?' missed':''}${isCur?' current':''}"
                     data-jump="${p.day}" title="${p.name}">${p.day}</button>`;
          }).join('')}
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Отладка активной сессии</div>
        <div class="adm-grid-2">
          <button class="adm-btn-sm primary" id="admSolveHang">Решить виселицу</button>
          <button class="adm-btn-sm primary" id="admWinM3">Выиграть в поле</button>
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Маркетплейс</div>
        <div class="adm-grid-2">
          <button class="adm-btn-sm" id="admMpWb">Сброс → WB</button>
          <button class="adm-btn-sm" id="admMpOzon">Сброс → Ozon</button>
        </div>
        <div style="color:#666; font-size:10.5px; margin-top:6px">
          Сбрасывает выбор маркетплейса и назначает новый.
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Сценарии</div>
        <div class="adm-grid-1">
          <button class="adm-btn-sm" id="admScnStart">Начало события (день 1)</button>
          <button class="adm-btn-sm" id="admScnMid">Середина (день 8, 1–7 пройдены)</button>
          <button class="adm-btn-sm" id="admScnMissed">С пропусками (день 10, 1–3 пройдены)</button>
          <button class="adm-btn-sm" id="admScnEnd">Событие завершено (14/14)</button>
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Онбординг</div>
        <div class="adm-grid-1">
          <button class="adm-btn-sm" id="admResetOb">Показать онбординг заново</button>
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-sec-title">Опасная зона</div>
        <div class="adm-grid-1">
          <button class="adm-btn-sm danger" id="admReset">Сбросить всё (включая онбординг)</button>
          <button class="adm-btn-sm danger" id="admResetAuth">Забыть пароль (сессия)</button>
          <button class="adm-btn-sm danger" id="admReload">Перезагрузить страницу</button>
        </div>
      </div>

      <div class="adm-sec">
        <div class="adm-json-toggle" id="admJsonToggle">
          <span class="adm-sec-title" style="margin:0">JSON состояния</span>
          <span style="color:#666; font-size:14px">${jsonOpen ? '−' : '+'}</span>
        </div>
        ${jsonOpen ? `
          <textarea class="adm-textarea" id="admJson">${JSON.stringify(S.get(), null, 2)}</textarea>
          <div class="adm-grid-2" style="margin-top:8px">
            <button class="adm-btn-sm primary" id="admApply">Применить</button>
            <button class="adm-btn-sm" id="admRefresh">Обновить</button>
          </div>
        ` : ''}
      </div>

      <div style="height:60px"></div>
    `;

    bindPanelEvents();
  }

  function safeGetScreen() {
    try {
      const fn = window.CLIMT_UI && window.CLIMT_UI.getActiveScreen;
      if (typeof fn === 'function') return screenRuName(fn());
    } catch (e) {}
    return '–';
  }

  function screenRuName(name) {
    const map = {
      home: 'Главная',
      days: 'Карта дней',
      hang: 'Виселица',
      m3: 'Поле',
      product: 'Карточка товара',
      cab: 'Косметичка',
      onboard: 'Онбординг',
    };
    return map[name] || name || '–';
  }

  function bindPanelEvents() {
    const S = window.CLIMT_STATE;

    document.getElementById('admClose').onclick = closePanel;

    panelEl.querySelectorAll('[data-shift]').forEach(btn => {
      btn.onclick = () => {
        const shift = parseInt(btn.dataset.shift, 10);
        try {
          const cur = new Date(S.get().startDate);
          if (isNaN(cur.getTime())) cur.setTime(Date.now());
          cur.setDate(cur.getDate() - shift);
          S.setStartDate(cur);
          window.CLIMT_HOME.render();
          toast('Старт: ' + (shift > 0 ? '+' : '') + shift + ' дн');
          renderPanel();
        } catch (e) { toast('Ошибка: ' + e.message); }
      };
    });

    const setDayBtn = document.getElementById('admSetDay');
    if (setDayBtn) {
      setDayBtn.onclick = () => {
        const input = document.getElementById('admDayInput');
        const day = parseInt(input.value, 10);
        if (!day || day < 1 || day > window.CLIMT_CONFIG.eventDays) {
          toast('День должен быть 1–' + window.CLIMT_CONFIG.eventDays);
          return;
        }
        try {
          S.forceCurrentDay(day);
          window.CLIMT_HOME.render();
          toast('Сегодня – день ' + day);
          renderPanel();
        } catch (e) { toast('Ошибка: ' + e.message); }
      };
    }

    panelEl.querySelectorAll('[data-jump]').forEach(btn => {
      btn.onclick = () => {
        const day = parseInt(btn.dataset.jump, 10);
        try {
          S.forceCurrentDay(Math.max(day, S.getCurrentEventDay()));
          S.unmarkDay(day);
          window.CLIMT_HOME.render();
          window.CLIMT_DAYS.startDay(day);
          toast('День ' + day + ' – с начала');
        } catch (e) { toast('Ошибка: ' + e.message); }
      };
    });

    document.getElementById('admSolveHang').onclick = () => {
      try {
        if (window.CLIMT_HANGMAN && typeof window.CLIMT_HANGMAN.solveAll === 'function') {
          window.CLIMT_HANGMAN.solveAll();
          toast('Виселица решена');
        } else toast('Виселица не активна');
      } catch (e) { toast('Ошибка: ' + e.message); }
    };

    document.getElementById('admWinM3').onclick = () => {
      try {
        if (window.CLIMT_MATCH3 && typeof window.CLIMT_MATCH3.winNow === 'function') {
          window.CLIMT_MATCH3.winNow();
          toast('Поле пройдено');
        } else toast('Поле не активно');
      } catch (e) { toast('Ошибка: ' + e.message); }
    };

    document.getElementById('admMpWb').onclick = () => {
      const s = S.get();
      s.marketplace = 'wb';
      S.save();
      toast('Маркетплейс: WB');
      renderPanel();
    };

    document.getElementById('admMpOzon').onclick = () => {
      const s = S.get();
      s.marketplace = 'ozon';
      S.save();
      toast('Маркетплейс: Ozon');
      renderPanel();
    };

    document.getElementById('admScnStart').onclick = () => {
      S.resetAll();
      window.CLIMT_HOME.render();
      toast('Сценарий: начало');
      renderPanel();
    };

    document.getElementById('admScnMid').onclick = () => {
      S.resetAll();
      S.forceCurrentDay(8);
      for (let i = 1; i <= 7; i++) S.markDay(i);
      window.CLIMT_HOME.render();
      toast('Сценарий: середина');
      renderPanel();
    };

    document.getElementById('admScnMissed').onclick = () => {
      S.resetAll();
      S.forceCurrentDay(10);
      for (let i = 1; i <= 3; i++) S.markDay(i);
      window.CLIMT_HOME.render();
      toast('Сценарий: с пропусками');
      renderPanel();
    };

    document.getElementById('admScnEnd').onclick = () => {
      S.resetAll();
      S.forceCurrentDay(14);
      S.setAllCompleted(true);
      window.CLIMT_HOME.render();
      toast('Сценарий: завершено');
      renderPanel();
    };

    document.getElementById('admResetOb').onclick = () => {
      try {
        if (window.CLIMT_ONBOARDING && typeof window.CLIMT_ONBOARDING.reset === 'function') {
          window.CLIMT_ONBOARDING.reset();
          window.CLIMT_ONBOARDING.show();
          closePanel();
          toast('Онбординг показан');
        }
      } catch (e) { toast('Ошибка: ' + e.message); }
    };

    document.getElementById('admReset').onclick = () => {
      if (!confirm('Сбросить весь прогресс и онбординг? Это действие необратимо.')) return;
      S.resetAll();
      try {
        if (window.CLIMT_ONBOARDING) window.CLIMT_ONBOARDING.reset();
      } catch (e) {}
      window.CLIMT_HOME.render();
      toast('Состояние и онбординг сброшены');
      renderPanel();
    };

    document.getElementById('admResetAuth').onclick = () => {
      try { sessionStorage.removeItem(ACTIVATION.sessionKey); } catch (e) {}
      authorized = false;
      closePanel();
      toast('Пароль забыт для этой сессии');
    };

    document.getElementById('admReload').onclick = () => location.reload();

    document.getElementById('admJsonToggle').onclick = () => {
      jsonOpen = !jsonOpen;
      renderPanel();
    };

    const applyBtn = document.getElementById('admApply');
    if (applyBtn) {
      applyBtn.onclick = () => {
        try {
          const raw = document.getElementById('admJson').value;
          const parsed = JSON.parse(raw);
          S.replaceState(parsed);
          window.CLIMT_HOME.render();
          toast('JSON применён');
          renderPanel();
        } catch (e) {
          toast('Ошибка JSON: ' + e.message);
        }
      };
    }

    const refreshBtn = document.getElementById('admRefresh');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        renderPanel();
        toast('Обновлено');
      };
    }
  }

  function init() {
    if (!window.CLIMT_STATE || !window.CLIMT_PRODUCTS) {
      setTimeout(init, 100);
      return;
    }
    injectStyles();
    buildUI();

    document.addEventListener('keydown', (e) => {
      if (checkHotkey(e)) {
        e.preventDefault();
        if (isOpen) closePanel();
        else tryOpen();
      }
      if (e.key === 'Escape' && isOpen) closePanel();
    });

    if (isAdminRequested()) {
      setTimeout(() => {
        if (isAuthorized() || requestPassword()) {
          isOpen = true;
          panelEl.classList.add('open');
          renderPanel();
        }
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else init();
})();