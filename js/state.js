(function () {
  const CFG = window.CLIMT_CONFIG;
  const defaults = {
    completed: {},
    promos: {},
    wordSolved: {},   // { dayNumber: true } — слово уже отгадано
    startDate: null,
    finalRewardUnlockedAt: null,
  };

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(CFG.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...defaults,
          ...parsed,
          wordSolved: parsed.wordSolved || {},
        };
      }
    } catch (e) {}
    const fresh = { ...defaults, startDate: new Date().toISOString() };
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(fresh)); } catch (e) {}
    return fresh;
  }

  function save() {
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(state)); } catch (e) {}
  }

  function getCurrentEventDay() {
    const start = new Date(state.startDate);
    const now = new Date();
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.floor((nowDate - startDate) / (24 * 60 * 60 * 1000));
    return Math.min(Math.max(diffDays + 1, 1), CFG.eventDays);
  }

  function getNextPlayableDay() {
    const cur = getCurrentEventDay();
    for (let i = 1; i <= cur; i++) {
      if (!state.completed[i]) return i;
    }
    return null;
  }

  function isEventComplete() {
    for (let i = 1; i <= CFG.eventDays; i++) if (!state.completed[i]) return false;
    return true;
  }

  function completeDay(day, code) {
    state.completed[day] = true;
    state.promos[day] = code;
    // После завершения дня слово больше не актуально
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

  function isWordSolved(day) {
    return !!state.wordSolved[day];
  }

  function getPromo(day) { return state.promos[day] || null; }
  function getCompletedCount() { return Object.keys(state.completed).length; }

  function getNextDayUnlockDate() {
    const start = new Date(state.startDate);
    const cur = getCurrentEventDay();
    if (cur >= CFG.eventDays) return null;
    const unlockAt = new Date(start);
    unlockAt.setDate(unlockAt.getDate() + cur);
    unlockAt.setHours(0, 0, 0, 0);
    return unlockAt;
  }

  function getFinalRewardUnlockedAt() {
    return state.finalRewardUnlockedAt ? new Date(state.finalRewardUnlockedAt) : null;
  }
  function isFinalRewardActive() {
    if (!isEventComplete()) return false;
    const u = getFinalRewardUnlockedAt();
    if (!u) return false;
    const exp = new Date(u);
    exp.setDate(exp.getDate() + CFG.finalRewardWindowDays);
    return new Date() < exp;
  }

  window.CLIMT_STATE = {
    get: () => state,
    save,
    getCurrentEventDay,
    getNextPlayableDay,
    isEventComplete,
    completeDay,
    markWordSolved,
    isWordSolved,
    getPromo,
    getCompletedCount,
    getNextDayUnlockDate,
    getFinalRewardUnlockedAt,
    isFinalRewardActive,
  };
})();