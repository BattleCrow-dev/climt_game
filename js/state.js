(function () {
  const CFG = window.CLIMT_CONFIG;
  const MS_PER_DAY = 86400000;

  function emptyState() {
    return {
      completed: {},
      promos: {},
      promoExpiry: {},   // { day: timestamp }
      wordSolved: {},
      marketplace: null, // 'wb' | 'ozon'
      startDate: new Date().toISOString(),
      finalRewardUnlockedAt: null,
    };
  }

  function sanitize(raw) {
    const clean = emptyState();
    if (!raw || typeof raw !== 'object') return clean;

    if (raw.completed && typeof raw.completed === 'object') clean.completed = raw.completed;
    if (raw.promos && typeof raw.promos === 'object') clean.promos = raw.promos;
    if (raw.promoExpiry && typeof raw.promoExpiry === 'object') clean.promoExpiry = raw.promoExpiry;
    if (raw.wordSolved && typeof raw.wordSolved === 'object') clean.wordSolved = raw.wordSolved;

    if (raw.marketplace === 'wb' || raw.marketplace === 'ozon') clean.marketplace = raw.marketplace;

    if (typeof raw.startDate === 'string') {
      const d = new Date(raw.startDate);
      if (!isNaN(d.getTime())) clean.startDate = d.toISOString();
    }
    if (typeof raw.finalRewardUnlockedAt === 'string') {
      const d = new Date(raw.finalRewardUnlockedAt);
      if (!isNaN(d.getTime())) clean.finalRewardUnlockedAt = d.toISOString();
    }
    return clean;
  }

  let state = (function load() {
    try {
      const raw = localStorage.getItem(CFG.storageKey);
      if (raw) return sanitize(JSON.parse(raw));
    } catch (e) {}
    const fresh = emptyState();
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(fresh)); } catch (e) {}
    return fresh;
  })();

  function save() {
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(state)); } catch (e) {}
  }

  function calendarDaysBetween(fromDate, toDate) {
    const fromUTC = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const toUTC = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    return Math.round((toUTC - fromUTC) / MS_PER_DAY);
  }

  function getCurrentEventDay() {
    const start = new Date(state.startDate);
    if (isNaN(start.getTime())) {
      state.startDate = new Date().toISOString();
      save();
      return 1;
    }
    const today = new Date();
    const diff = calendarDaysBetween(start, today);
    const day = diff + 1;
    return Math.min(Math.max(day, 1), CFG.eventDays);
  }

  /**
   * День, который сейчас можно играть.
   * Это первый непройденный день в окне [currentDay - catchUpWindow, currentDay].
   * Если в этом окне всё пройдено, возвращает null.
   */
  function getPlayableDay() {
    const cur = getCurrentEventDay();
    const minDay = Math.max(1, cur - CFG.catchUpWindowDays);
    for (let d = minDay; d <= cur; d++) {
      if (!state.completed[d]) return d;
    }
    return null;
  }

  /**
   * Дни, которые навсегда пропущены – они до окна catch-up и не пройдены.
   */
  function getMissedDays() {
    const cur = getCurrentEventDay();
    const minDay = Math.max(1, cur - CFG.catchUpWindowDays);
    const result = [];
    for (let d = 1; d < minDay; d++) {
      if (!state.completed[d]) result.push(d);
    }
    return result;
  }

  function isDayMissed(day) {
    const cur = getCurrentEventDay();
    const minDay = Math.max(1, cur - CFG.catchUpWindowDays);
    return day < minDay && !state.completed[day];
  }

  function getVisibleDaysCount() {
    return getCurrentEventDay();
  }

  function isEventComplete() {
    for (let i = 1; i <= CFG.eventDays; i++) if (!state.completed[i]) return false;
    return true;
  }

  /**
   * Завершение дня. code – промокод, promoExpiresAt – timestamp окончания.
   */
  function completeDay(day, code, promoExpiresAt) {
    state.completed[day] = true;
    state.promos[day] = code;
    state.promoExpiry[day] = promoExpiresAt || (Date.now() + CFG.promoDurationDays * MS_PER_DAY);
    delete state.wordSolved[day];
    if (isEventComplete() && !state.finalRewardUnlockedAt) {
      state.finalRewardUnlockedAt = new Date().toISOString();
    }
    save();
  }

  function markWordSolved(day) {
    state.wordSolved[day] = true;
    save();
  }

  function isWordSolved(day) { return !!state.wordSolved[day]; }

  function getPromo(day) { return state.promos[day] || null; }

  function getPromoExpiry(day) {
    const t = state.promoExpiry[day];
    return t ? new Date(t) : null;
  }

  function isPromoActive(day) {
    const exp = getPromoExpiry(day);
    if (!exp) return false;
    return new Date() < exp;
  }

  function getCompletedCount() { return Object.keys(state.completed).length; }

  function getNextDayUnlockDate() {
    const start = new Date(state.startDate);
    if (isNaN(start.getTime())) return null;
    const cur = getCurrentEventDay();
    if (cur >= CFG.eventDays) return null;
    const unlockAt = new Date(start);
    unlockAt.setDate(unlockAt.getDate() + cur);
    unlockAt.setHours(0, 0, 0, 0);
    return unlockAt;
  }

  // ============================================================
  // MARKETPLACE
  // ============================================================
  function getMarketplace() { return state.marketplace; }

  function setMarketplace(mp) {
    if (mp !== 'wb' && mp !== 'ozon') return false;
    if (state.marketplace) return state.marketplace === mp; // уже выбрано
    state.marketplace = mp;
    save();
    return true;
  }

  // ============================================================
  // FINAL REWARD
  // ============================================================
  function getFinalRewardUnlockedAt() {
    return state.finalRewardUnlockedAt ? new Date(state.finalRewardUnlockedAt) : null;
  }

  function isFinalRewardActive() {
    if (!isEventComplete()) return false;
    const u = getFinalRewardUnlockedAt();
    if (!u || isNaN(u.getTime())) return false;
    const exp = new Date(u);
    exp.setDate(exp.getDate() + CFG.finalRewardWindowDays);
    return new Date() < exp;
  }

  // ============================================================
  // ADMIN API
  // ============================================================
  function resetAll() {
    state = emptyState();
    save();
  }

  function setStartDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return;
    state.startDate = d.toISOString();
    save();
  }

  function forceCurrentDay(day) {
    const target = new Date();
    target.setDate(target.getDate() - (day - 1));
    target.setHours(9, 0, 0, 0);
    setStartDate(target);
  }

  function unmarkDay(day) {
    delete state.completed[day];
    delete state.promos[day];
    delete state.promoExpiry[day];
    delete state.wordSolved[day];
    if (!isEventComplete()) state.finalRewardUnlockedAt = null;
    save();
  }

  function markDay(day, code, expiresAt) {
    state.completed[day] = true;
    state.promos[day] = code || 'CLIMT-DEBUG-' + day;
    state.promoExpiry[day] = expiresAt || (Date.now() + CFG.promoDurationDays * MS_PER_DAY);
    delete state.wordSolved[day];
    if (isEventComplete() && !state.finalRewardUnlockedAt) {
      state.finalRewardUnlockedAt = new Date().toISOString();
    }
    save();
  }

  function setAllCompleted(flag) {
    if (flag) {
      for (let i = 1; i <= CFG.eventDays; i++) {
        state.completed[i] = true;
        state.promos[i] = state.promos[i] || 'CLIMT-DEBUG-' + i;
        state.promoExpiry[i] = state.promoExpiry[i] || (Date.now() + CFG.promoDurationDays * MS_PER_DAY);
      }
      state.wordSolved = {};
      state.finalRewardUnlockedAt = new Date().toISOString();
    } else {
      state.completed = {};
      state.promos = {};
      state.promoExpiry = {};
      state.wordSolved = {};
      state.finalRewardUnlockedAt = null;
    }
    save();
  }

  function replaceState(newState) {
    state = sanitize(newState);
    save();
  }

  window.CLIMT_STATE = {
    get: () => state,
    save,
    getCurrentEventDay,
    getPlayableDay,
    getMissedDays,
    isDayMissed,
    getVisibleDaysCount,
    isEventComplete,
    completeDay,
    markWordSolved,
    isWordSolved,
    getPromo,
    getPromoExpiry,
    isPromoActive,
    getCompletedCount,
    getNextDayUnlockDate,
    getMarketplace,
    setMarketplace,
    getFinalRewardUnlockedAt,
    isFinalRewardActive,
    resetAll,
    setStartDate,
    forceCurrentDay,
    unmarkDay,
    markDay,
    setAllCompleted,
    replaceState,
  };
})();