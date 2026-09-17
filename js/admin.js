/**
 * Админ-панель для отладки игры.
 * Активация: ?admin=1 в URL, либо Ctrl+Shift+A (Cmd+Shift+A).
 * Живёт отдельно от игровой логики, ничего не ломает.
 */
(function () {
  'use strict';

  const ACTIVATION = {
    urlParam: 'admin',
    hotkey: { ctrl: true, shift: true, key: 'A' },
  };

  let panelEl = null;
  let btnEl = null;
  let isOpen = false;

  // --- Проверки ---

  function isAdminRequested() {
    const params = new URLSearchParams(window.location.search);
    return params.get(ACTIVATION.urlParam) === '1';
  }

  function checkHotkey(e) {
    return (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      e.key.toUpperCase() === ACTIVATION.hotkey.key
    );
  }

  // --- Хелперы состояния ---

  function getStateObj() { return window.CLIMT_STATE.get(); }

  function saveState() {
    window.CLIMT_STATE.save();
  }

  function setStartDateDaysAgo(days) {
    const s = getStateObj();
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(9, 0, 0, 0);
    s.startDate = d.toISOString();
    saveState();
  }

  function setAllDaysCompleted(completed) {
    const s = getStateObj();
    s.completed = {};
    s.promos = {};
    if (completed) {
      const total = window.CLIMT_CONFIG.eventDays;
      for (let i = 1; i <= total; i++) {
        s.completed[i] = true;
        s.promos[i] = 'CLIMT-DEBUG-' + i;
      }
      if (!s.finalRewardUnlockedAt) {
        s.finalRewardUnlockedAt = new Date().toISOString();
      }
    } else {
      s.finalRewardUnlockedAt = null;
    }
    saveState();
  }

  function resetAll() {
    const s = getStateObj();
    s.completed = {};
    s.promos = {};
    s.wordSolved = {};
    s.finalRewardUnlockedAt = null;
    s.startDate = new Date().toISOString();
    saveState();
  }

  function markDayComplete(day) {
    window.CLIMT_STATE.completeDay(day, 'CLIMT-DEBUG-' + day);
  }

  function unmarkDay(day) {
    const s = getStateObj();
    delete s.completed[day];
    delete s.promos[day];
    delete s.wordSolved[day];
    s.finalRewardUnlockedAt = null;
    saveState();
  }

  // --- Действия навигации ---

  function goScreen(name) {
    try {
      switch (name) {
        case 'home':     window.CLIMT_HOME.render(); break;
        case 'days':     window.CLIMT_DAYS.render(); break;
        case 'cab':      window.CLIMT_CABINET.render(); break;
        case 'hang': {
          const p = window.CLIMT_PRODUCTS[0];
          window.CLIMT_HANGMAN.init(p);
          break;
        }
        case 'm3': {
          window.CLIMT_UI.show('m3', { onBack: () => window.CLIMT_DAYS.render() });
          const p = window.CLIMT_PRODUCTS[0];
          requestAnimationFrame(() => requestAnimationFrame(() => {
            window.CLIMT_MATCH3.init(p);
          }));
          break;
        }
        case 'reward': {
          const p = window.CLIMT_PRODUCTS[0];
          window.CLIMT_REWARD.show(p.day, 'CLIMT-DEBUG-REWARD');
          break;
        }
      }
      toast('Экран: ' + name);
    } catch (err) {
      toast('Ошибка: ' + err.message);
    }
  }

  function jumpToDay(day) {
    try {
      // Сбрасываем день, чтобы можно было пройти заново
      unmarkDay(day);
      // Убеждаемся, что день открыт — если дата старта не позволяет, подкручиваем
      const cur = window.CLIMT_STATE.getCurrentEventDay();
      if (day > cur) {
        // Сдвигаем старт так, чтобы день был открыт
        setStartDateDaysAgo(day - 1);
      }
      window.CLIMT_DAYS.startDay(day);
      toast('Переход: день ' + day);
    } catch (err) {
      toast('Ошибка: ' + err.message);
    }
  }

  function goToRewardForDay(day) {
    try {
      window.CLIMT_REWARD.show(day, 'CLIMT-DEBUG-' + day);
      toast('Reward: день ' + day);
    } catch (err) {
      toast('Ошибка: ' + err.message);
    }
  }

  // --- Стили ---

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .adm-btn {
        position: fixed; bottom: 18px; right: 18px; z-index: 9999;
        width: 48px; height: 48px; border-radius: 50%;
        background: #2a2722; color: #fff;
        border: none; cursor: pointer;
        font-size: 20px; line-height: 1;
        box-shadow: 0 6px 20px rgba(0,0,0,.25);
        transition: transform .2s;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      .adm-btn:hover { transform: scale(1.06); }
      .adm-btn:active { transform: scale(.96); }

      .adm-panel {
        position: fixed; top: 0; right: 0; bottom: 0;
        width: 400px; max-width: 100vw;
        background: #1a1815; color: #e8e6e2;
        z-index: 9998;
        overflow-y: auto;
        box-shadow: -8px 0 32px rgba(0,0,0,.4);
        transform: translateX(100%);
        transition: transform .3s cubic-bezier(.22,.8,.24,1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
        font-size: 13px;
        line-height: 1.5;
      }
      .adm-panel.open { transform: translateX(0); }

      .adm-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #33302b;
        position: sticky; top: 0;
        background: #1a1815; z-index: 2;
      }
      .adm-header h2 {
        font-size: 14px; font-weight: 600;
        letter-spacing: .14em; text-transform: uppercase;
        color: #c9a86a; margin: 0;
      }
      .adm-close {
        background: none; border: 1px solid #33302b; color: #e8e6e2;
        width: 30px; height: 30px; border-radius: 6px;
        cursor: pointer; font-size: 16px;
        font-family: inherit;
      }
      .adm-close:hover { border-color: #c9a86a; color: #c9a86a; }

      .adm-section {
        padding: 18px 20px;
        border-bottom: 1px solid #262420;
      }
      .adm-section h3 {
        font-size: 10px; letter-spacing: .16em; text-transform: uppercase;
        color: #847e74; margin: 0 0 12px; font-weight: 600;
      }

      .adm-grid {
        display: grid; gap: 6px;
      }
      .adm-grid-2 { grid-template-columns: 1fr 1fr; }
      .adm-grid-3 { grid-template-columns: repeat(3, 1fr); }
      .adm-grid-4 { grid-template-columns: repeat(4, 1fr); }
      .adm-grid-7 { grid-template-columns: repeat(7, 1fr); }

      .adm-btn-sm {
        background: #252220; color: #e8e6e2;
        border: 1px solid #33302b;
        padding: 8px 10px; border-radius: 6px;
        cursor: pointer; font-size: 12px;
        font-family: inherit; text-align: center;
        transition: all .15s;
      }
      .adm-btn-sm:hover {
        background: #2f2c28; border-color: #c9a86a;
      }
      .adm-btn-sm:active { transform: scale(.97); }
      .adm-btn-sm.primary {
        background: #c9a86a; color: #1a1815;
        border-color: #c9a86a; font-weight: 600;
      }
      .adm-btn-sm.primary:hover { background: #d9b97a; }
      .adm-btn-sm.danger {
        background: #3a1f1f; color: #e8b4b4;
        border-color: #5a2f2f;
      }
      .adm-btn-sm.danger:hover { background: #4a2525; border-color: #8a4a4a; }
      .adm-btn-sm.active {
        background: #6b866b; color: #fff;
        border-color: #6b866b;
      }
      .adm-btn-sm.small {
        padding: 6px 8px; font-size: 11px;
      }

      .adm-info {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11.5px;
        background: #0f0d0b;
        border: 1px solid #262420;
        border-radius: 6px;
        padding: 10px 12px;
        color: #b5b1a8;
        word-break: break-all;
      }
      .adm-info strong { color: #c9a86a; font-weight: 500; }

      .adm-textarea {
        width: 100%;
        min-height: 180px;
        background: #0f0d0b;
        border: 1px solid #262420;
        border-radius: 6px;
        color: #b5b1a8;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        padding: 10px;
        resize: vertical;
        box-sizing: border-box;
      }
      .adm-textarea:focus { outline: none; border-color: #c9a86a; }

      .adm-row {
        display: flex; gap: 6px; align-items: center;
        margin-top: 8px;
      }
      .adm-row input[type="number"] {
        background: #0f0d0b;
        border: 1px solid #262420;
        border-radius: 6px;
        color: #e8e6e2;
        padding: 7px 10px;
        width: 70px;
        font-family: inherit;
        font-size: 12px;
      }

      .adm-toast {
        position: fixed; bottom: 80px; right: 20px;
        background: #2a2722; color: #fff;
        padding: 10px 16px; border-radius: 8px;
        font-size: 12px;
        z-index: 10000;
        box-shadow: 0 6px 20px rgba(0,0,0,.4);
        opacity: 0;
        transform: translateY(10px);
        transition: all .25s;
        pointer-events: none;
        max-width: 320px;
      }
      .adm-toast.show { opacity: 1; transform: translateY(0); }
    `;
    document.head.appendChild(style);
  }

  // --- Тост админки ---

  let admToastTimer = null;
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
    clearTimeout(admToastTimer);
    admToastTimer = setTimeout(() => el.classList.remove('show'), 2000);
  }

  // --- Рендер панели ---

  function buildUI() {
    // Плавающая кнопка
    btnEl = document.createElement('button');
    btnEl.className = 'adm-btn';
    btnEl.textContent = '⚙';
    btnEl.title = 'Админ-панель (Ctrl+Shift+A)';
    btnEl.onclick = togglePanel;
    document.body.appendChild(btnEl);

    // Панель
    panelEl = document.createElement('div');
    panelEl.className = 'adm-panel';
    panelEl.id = 'admPanel';
    document.body.appendChild(panelEl);
  }

  function togglePanel() {
    isOpen = !isOpen;
    panelEl.classList.toggle('open', isOpen);
    if (isOpen) renderPanel();
  }

  function renderPanel() {
    const State = window.CLIMT_STATE;
    const CFG = window.CLIMT_CONFIG;
    const Products = window.CLIMT_PRODUCTS;

    // Защита: если модуль не отдаёт метод, подставляем заглушку
    const safeCall = (obj, method, fallback) => {
      try {
        if (obj && typeof obj[method] === 'function') return obj[method]();
      } catch (e) { /* ignore */ }
      return fallback;
    };

    const cur = State.getCurrentEventDay();
    const next = State.getNextPlayableDay();
    const completed = State.getCompletedCount();
    const startDate = new Date(State.get().startDate);
    const isComplete = State.isEventComplete();
    const finalActive = State.isFinalRewardActive();

    // Данные активной сессии — безопасный вызов
    const hState = safeCall(window.CLIMT_HANGMAN, 'getState', null);
    const m3State = safeCall(window.CLIMT_MATCH3, 'getState', null);
    const activeScreen = safeCall(window.CLIMT_UI, 'getActiveScreen', '—');

    panelEl.innerHTML = `
      <div class="adm-header">
        <h2>Админ-панель</h2>
        <button class="adm-close" id="admClose">✕</button>
      </div>

      <!-- Инфо о состоянии -->
      <div class="adm-section">
        <h3>Текущее состояние</h3>
        <div class="adm-info">
          <div><strong>Экран:</strong> ${activeScreen || '—'}</div>
          <div><strong>Календарный день:</strong> ${cur} / ${CFG.eventDays}</div>
          <div><strong>Следующий играбельный:</strong> ${next ?? 'все пройдено'}</div>
          <div><strong>Пройдено:</strong> ${completed} / ${CFG.eventDays}</div>
          <div><strong>Событие завершено:</strong> ${isComplete ? 'да' : 'нет'}</div>
          <div><strong>Финальный приз активен:</strong> ${finalActive ? 'да' : 'нет'}</div>
          <div><strong>Дата старта:</strong> ${startDate.toLocaleDateString('ru-RU')} ${startDate.toLocaleTimeString('ru-RU').slice(0,5)}</div>
        </div>
      </div>

      <!-- Навигация по экранам -->
      <div class="adm-section">
        <h3>Переход на экран</h3>
        <div class="adm-grid adm-grid-3">
          <button class="adm-btn-sm" data-nav="home">Home</button>
          <button class="adm-btn-sm" data-nav="days">Days</button>
          <button class="adm-btn-sm" data-nav="cab">Cabinet</button>
          <button class="adm-btn-sm" data-nav="hang">Hangman</button>
          <button class="adm-btn-sm" data-nav="m3">Match3</button>
          <button class="adm-btn-sm" data-nav="reward">Reward</button>
        </div>
      </div>

      <!-- Переход к дню -->
      <div class="adm-section">
        <h3>Перейти к дню (запуск с начала)</h3>
        <div class="adm-grid adm-grid-7">
          ${Products.map(p => `
            <button class="adm-btn-sm small ${State.get().completed[p.day] ? 'active' : ''}"
                    data-jump="${p.day}" title="${p.name}">${p.day}</button>
          `).join('')}
        </div>
      </div>

      <!-- Показать reward для дня -->
      <div class="adm-section">
        <h3>Показать reward за день</h3>
        <div class="adm-grid adm-grid-7">
          ${Products.map(p => `
            <button class="adm-btn-sm small" data-reward="${p.day}">${p.day}</button>
          `).join('')}
        </div>
      </div>

      <!-- Управление днём -->
      <div class="adm-section">
        <h3>Отметить день пройденным</h3>
        <div class="adm-grid adm-grid-7">
          ${Products.map(p => `
            <button class="adm-btn-sm small" data-complete="${p.day}">✓${p.day}</button>
          `).join('')}
        </div>
        <h3 style="margin-top:14px">Отменить прохождение</h3>
        <div class="adm-grid adm-grid-7">
          ${Products.map(p => `
            <button class="adm-btn-sm small danger" data-uncomplete="${p.day}">✕${p.day}</button>
          `).join('')}
        </div>
      </div>

      <!-- Отладка активной сессии -->
      <div class="adm-section">
        <h3>Отладка активной сессии</h3>
        <div class="adm-grid adm-grid-2">
          <button class="adm-btn-sm primary" id="admSolveHang">Пропустить виселицу</button>
          <button class="adm-btn-sm primary" id="admWinM3">Выиграть в Match-3</button>
        </div>
        <div class="adm-info" style="margin-top:10px">
          ${hState ? `<div><strong>Hangman:</strong> слово «${hState.word}», открыто ${hState.revealed.filter(Boolean).length}/${hState.revealed.length}, попыток ${hState.attempts}</div>` : '<div><strong>Hangman:</strong> неактивен</div>'}
          ${m3State ? `<div><strong>Match-3:</strong> ${m3State.score}/${m3State.target} троек, ходов ${m3State.moves}, фаза ${m3State.phase}</div>` : '<div><strong>Match-3:</strong> неактивен</div>'}
        </div>
      </div>

      <!-- Глобальные операции -->
      <div class="adm-section">
        <h3>Симуляции</h3>
        <div class="adm-grid adm-grid-1">
          <button class="adm-btn-sm" id="admSimStart">Старт события (день 1, всё сброшено)</button>
          <button class="adm-btn-sm" id="admSimMid">Середина (дни 1–7 пройдены)</button>
          <button class="adm-btn-sm" id="admSimEnd">Финал (все 14 пройдены)</button>
          <button class="adm-btn-sm" id="admSimNewDay">Новый день открылся (день 1, 1 день назад)</button>
        </div>
      </div>

      <!-- Управление датой старта -->
      <div class="adm-section">
        <h3>Дата старта события</h3>
        <div class="adm-row">
          <input type="number" id="admDaysAgo" value="0" min="0" max="365">
          <span style="color:#847e74; font-size:12px">дней назад</span>
          <button class="adm-btn-sm" id="admSetStart" style="flex:1">Применить</button>
        </div>
        <div class="adm-grid adm-grid-1" style="margin-top:8px">
          <button class="adm-btn-sm" id="admStartToday">Старт сегодня</button>
        </div>
      </div>

      <!-- Массовые действия -->
      <div class="adm-section">
        <h3>Массовые действия</h3>
        <div class="adm-grid adm-grid-1">
          <button class="adm-btn-sm" id="admCompleteAll">Отметить все 14 как пройденные</button>
          <button class="adm-btn-sm danger" id="admReset">Сбросить всё состояние</button>
          <button class="adm-btn-sm danger" id="admReload">Перезагрузить приложение</button>
        </div>
      </div>

      <!-- State JSON -->
      <div class="adm-section">
        <h3>localStorage state (JSON)</h3>
        <textarea class="adm-textarea" id="admState">${JSON.stringify(State.get(), null, 2)}</textarea>
        <div class="adm-grid adm-grid-2" style="margin-top:8px">
          <button class="adm-btn-sm primary" id="admApplyState">Применить JSON</button>
          <button class="adm-btn-sm" id="admRefreshState">Обновить</button>
        </div>
      </div>

      <div style="height: 40px"></div>
    `;

    // Обработчики
    document.getElementById('admClose').onclick = togglePanel;

    panelEl.querySelectorAll('[data-nav]').forEach(btn => {
      btn.onclick = () => { goScreen(btn.dataset.nav); renderPanel(); };
    });
    panelEl.querySelectorAll('[data-jump]').forEach(btn => {
      btn.onclick = () => {
        jumpToDay(parseInt(btn.dataset.jump, 10));
        togglePanel();
      };
    });
    panelEl.querySelectorAll('[data-reward]').forEach(btn => {
      btn.onclick = () => {
        goToRewardForDay(parseInt(btn.dataset.reward, 10));
        togglePanel();
      };
    });
    panelEl.querySelectorAll('[data-complete]').forEach(btn => {
      btn.onclick = () => {
        markDayComplete(parseInt(btn.dataset.complete, 10));
        toast('День отмечен пройденным');
        renderPanel();
      };
    });
    panelEl.querySelectorAll('[data-uncomplete]').forEach(btn => {
      btn.onclick = () => {
        unmarkDay(parseInt(btn.dataset.uncomplete, 10));
        toast('Прохождение отменено');
        renderPanel();
      };
    });

    document.getElementById('admSolveHang').onclick = () => {
      try {
        if (window.CLIMT_HANGMAN && typeof window.CLIMT_HANGMAN.solveAll === 'function') {
          window.CLIMT_HANGMAN.solveAll();
          toast('Виселица решена');
        } else {
          toast('Hangman не активен');
        }
      } catch (e) {
        toast('Ошибка: ' + e.message);
      }
    };
    document.getElementById('admWinM3').onclick = () => {
      try {
        if (window.CLIMT_MATCH3 && typeof window.CLIMT_MATCH3.winNow === 'function') {
          window.CLIMT_MATCH3.winNow();
          toast('Match-3 завершён победой');
        } else {
          toast('Match-3 не активен');
        }
      } catch (e) {
        toast('Ошибка: ' + e.message);
      }
    };

    document.getElementById('admSimStart').onclick = () => {
      resetAll();
      window.CLIMT_HOME.render();
      toast('Симуляция: старт события');
      renderPanel();
    };
    document.getElementById('admSimMid').onclick = () => {
      resetAll();
      setStartDateDaysAgo(7);
      const s = getStateObj();
      for (let i = 1; i <= 7; i++) {
        s.completed[i] = true;
        s.promos[i] = 'CLIMT-DEBUG-' + i;
      }
      saveState();
      window.CLIMT_HOME.render();
      toast('Симуляция: середина события');
      renderPanel();
    };
    document.getElementById('admSimEnd').onclick = () => {
      setStartDateDaysAgo(15);
      setAllDaysCompleted(true);
      window.CLIMT_HOME.render();
      toast('Симуляция: событие завершено');
      renderPanel();
    };
    document.getElementById('admSimNewDay').onclick = () => {
      resetAll();
      setStartDateDaysAgo(1);
      window.CLIMT_HOME.render();
      toast('Симуляция: открыт день 2');
      renderPanel();
    };

    document.getElementById('admSetStart').onclick = () => {
      const days = parseInt(document.getElementById('admDaysAgo').value, 10) || 0;
      setStartDateDaysAgo(days);
      window.CLIMT_HOME.render();
      toast('Дата старта: ' + days + ' дн. назад');
      renderPanel();
    };
    document.getElementById('admStartToday').onclick = () => {
      setStartDateDaysAgo(0);
      window.CLIMT_HOME.render();
      toast('Дата старта: сегодня');
      renderPanel();
    };

    document.getElementById('admCompleteAll').onclick = () => {
      setAllDaysCompleted(true);
      toast('Все 14 дней отмечены');
      renderPanel();
    };
    document.getElementById('admReset').onclick = () => {
      if (!confirm('Сбросить весь прогресс? Это действие необратимо.')) return;
      resetAll();
      window.CLIMT_HOME.render();
      toast('Состояние сброшено');
      renderPanel();
    };
    document.getElementById('admReload').onclick = () => {
      location.reload();
    };

    document.getElementById('admApplyState').onclick = () => {
      try {
        const raw = document.getElementById('admState').value;
        const parsed = JSON.parse(raw);
        const s = getStateObj();
        Object.keys(parsed).forEach(k => { s[k] = parsed[k]; });
        saveState();
        window.CLIMT_HOME.render();
        toast('JSON применён');
        renderPanel();
      } catch (err) {
        toast('Ошибка JSON: ' + err.message);
      }
    };
    document.getElementById('admRefreshState').onclick = () => {
      renderPanel();
      toast('Обновлено');
    };
  }

  // --- Инициализация ---

  function init() {
    // Ждём, пока основное приложение загрузится
    if (!window.CLIMT_STATE || !window.CLIMT_PRODUCTS) {
      setTimeout(init, 100);
      return;
    }

    injectStyles();
    buildUI();

    // Проверка хоткея
    document.addEventListener('keydown', (e) => {
      if (checkHotkey(e)) {
        e.preventDefault();
        togglePanel();
      }
      if (e.key === 'Escape' && isOpen) {
        togglePanel();
      }
    });

    // Открытие по URL-параметру
    if (isAdminRequested()) {
      // Небольшая задержка, чтобы UI успел отрисоваться
      setTimeout(() => {
        isOpen = true;
        panelEl.classList.add('open');
        renderPanel();
      }, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();