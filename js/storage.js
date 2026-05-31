const Storage = (() => {
  const PREFIX = "ru_en_trainer_srs_";
  const STATS_KEY = "ru_en_trainer_stats";
  const LEGACY_PREFIX = "srs_";
  const LEGACY_STATS_KEY = "srs_stats";
  let lastError = null;

  function safeGetItem(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      lastError = null;
      return true;
    } catch {
      lastError = "storage_write_failed";
      return false;
    }
  }

  function safeRemoveItem(key) {
    try { localStorage.removeItem(key); } catch {}
  }

  function parseJSON(raw) {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  function isKnownCardId(id) {
    if (typeof VOCABULARY === "undefined") return true;
    return VOCABULARY.some(word => word.id === id) || getCustomWords().some(word => word.id === id);
  }

  function getCard(id) {
    const card = parseJSON(safeGetItem(PREFIX + id));
    if (card) return card;

    const legacyCard = parseJSON(safeGetItem(LEGACY_PREFIX + id));
    if (legacyCard) setCard(legacyCard);
    return legacyCard;
  }

  function setCard(card) {
    return safeSetItem(PREFIX + card.id, JSON.stringify(card));
  }

  function updateCard(id, grade) {
    if (!id || !Number.isInteger(grade) || grade < 0 || grade > 3) {
      lastError = "invalid_review_grade";
      return null;
    }
    const card = getCard(id) || SRS.createCard(id);
    const updated = SRS.rate(card, grade);
    return setCard(updated) ? updated : null;
  }

  function getAllCards() {
    const cards = [];
    const seen = new Set();
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || (!key.startsWith(PREFIX) && !key.startsWith(LEGACY_PREFIX))) continue;
        if (key === STATS_KEY || key === LEGACY_STATS_KEY) continue;

        const card = parseJSON(safeGetItem(key));
        if (card && card.id && isKnownCardId(card.id) && !seen.has(card.id)) {
          seen.add(card.id);
          cards.push(card);
        }
      }
    } catch {}
    return cards;
  }

  function getAllCardStates() {
    return getAllCards();
  }

  function getStats() {
    const fallback = { streak: 0, lastStudyDate: null, totalReviews: 0 };
    const stats = parseJSON(safeGetItem(STATS_KEY));
    if (stats) return { ...fallback, ...stats };

    const legacyStats = parseJSON(safeGetItem(LEGACY_STATS_KEY));
    if (legacyStats) {
      const migrated = { ...fallback, ...legacyStats };
      safeSetItem(STATS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return fallback;
  }

  function recordStudySession(reviewCount) {
    const stats = getStats();
    const today = new Date().toDateString();
    if (stats.lastStudyDate === today) {
      stats.totalReviews += reviewCount;
      stats.todayReviews = (stats.todayReviews || 0) + reviewCount;
    } else {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      stats.streak = stats.lastStudyDate === yesterday ? stats.streak + 1 : 1;
      stats.lastStudyDate = today;
      stats.totalReviews += reviewCount;
      stats.todayReviews = reviewCount;
    }
    safeSetItem(STATS_KEY, JSON.stringify(stats));
  }

  function getDailyGoal() {
    return parseInt(safeGetItem("ru_en_goal") || "20", 10);
  }

  function setDailyGoal(n) {
    safeSetItem("ru_en_goal", String(n));
  }

  // New cards introduced per day. Keeps beginners from being flooded with
  // every unseen word at once — only this many brand-new cards appear daily.
  function getNewPerDay() {
    return parseInt(safeGetItem("ru_en_new_per_day") || "10", 10);
  }

  function setNewPerDay(n) {
    safeSetItem("ru_en_new_per_day", String(n));
  }

  function getNewIntroducedToday() {
    const stats = getStats();
    if (stats.lastNewDate !== new Date().toDateString()) return 0;
    return stats.newToday || 0;
  }

  function recordNewIntroduced(count) {
    const stats = getStats();
    const today = new Date().toDateString();
    if (stats.lastNewDate === today) {
      stats.newToday = (stats.newToday || 0) + count;
    } else {
      stats.lastNewDate = today;
      stats.newToday = count;
    }
    safeSetItem(STATS_KEY, JSON.stringify(stats));
  }

  function getTodayReviews() {
    const stats = getStats();
    if (stats.lastStudyDate !== new Date().toDateString()) return 0;
    return stats.todayReviews || 0;
  }

  function getCardsDueBy(date) {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const endMs = endOfDay.getTime();
    const vocab = (typeof VOCABULARY !== 'undefined' ? VOCABULARY : []).concat(getCustomWords());
    return vocab.filter(w => {
      const card = getCard(w.id) || SRS.createCard(w.id);
      return card.nextReview <= endMs;
    });
  }

  function getCustomWords() {
    return parseJSON(safeGetItem("ru_en_custom_words")) || [];
  }

  function getAllGrammarProgress() {
    const progress = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith("ru_en_grammar_")) continue;

        const id = key.slice("ru_en_grammar_".length);
        const data = parseJSON(safeGetItem(key));
        if (id && data) progress[id] = data;
      }
    } catch {}
    return progress;
  }

  function addCustomWord(ru, en, category) {
    const words = getCustomWords();
    // Random suffix as well as the timestamp: several words can be added in a
    // single loop within the same millisecond (e.g. importing a lesson's
    // vocabulary), and a shared id would make them collide on one SRS card key.
    const id = "u" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const word = { id, ru: ru.trim(), en: en.trim(), translit: "", category: category || "custom" };
    words.push(word);
    safeSetItem("ru_en_custom_words", JSON.stringify(words));
    return word;
  }

  function deleteCustomWord(id) {
    const words = getCustomWords().filter(w => w.id !== id);
    safeSetItem("ru_en_custom_words", JSON.stringify(words));
  }

  function getDueCountsByDate() {
    const DAY = 86400000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayMs = todayStart.getTime();
    const now = Date.now();
    const counts = { tomorrow: 0, thisWeek: 0, nextDueMs: null };
    // Include sentences (reading / speaking-EN sentence mode) alongside vocabulary
    // and custom words, so the end-of-session forecast doesn't under-report what
    // is actually scheduled for tomorrow / this week.
    const vocab = (typeof VOCABULARY !== 'undefined' ? VOCABULARY : [])
      .concat(typeof SENTENCES !== 'undefined' ? SENTENCES : [])
      .concat(getCustomWords());
    vocab.forEach(w => {
      const card = getCard(w.id);
      if (!card) return;
      const dayDiff = Math.floor((card.nextReview - todayMs) / DAY);
      if (dayDiff === 1) counts.tomorrow++;
      if (dayDiff >= 2 && dayDiff <= 7) counts.thisWeek++;
      if (card.nextReview > now && (counts.nextDueMs === null || card.nextReview < counts.nextDueMs)) {
        counts.nextDueMs = card.nextReview;
      }
    });
    return counts;
  }

  function getMasteredCount() {
    return getAllCards().filter(c => c.repetitions >= 3 && c.easeFactor >= 2.1).length;
  }

  // "Сбросить весь прогресс" must clear everything the app stores, not just SRS
  // cards/stats: grammar progress, custom words, daily goal, new-per-day, the AI
  // knowledge base and the id-migration flag all live under the "ru_en_" prefix.
  // Legacy keys (srs_*, including srs_stats) are removed wholesale too.
  function resetAll() {
    const keysToRemove = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("ru_en_") || key.startsWith(LEGACY_PREFIX)) {
          keysToRemove.push(key);
        }
      }
    } catch {}
    keysToRemove.forEach(safeRemoveItem);
  }

  function getLastError() {
    return lastError;
  }

  function migrateCardIds() {
    if (safeGetItem("ru_en_id_migration_v1") === "done") return;
    const ranges = [
      ["g",  "gt",  1,  15], ["n",  "nu",  1,  20], ["f",  "fm",  1,  12],
      ["p",  "pl",  1,  12], ["v",  "vb",  1,  20], ["a",  "aj",  1,  15],
      ["d",  "dy",  1,   7], ["v2", "vx",  1,  20], ["a2", "ax",  1,  15],
      ["s",  "sn",  1, 100],
    ];
    ranges.forEach(([op, np, start, end]) => {
      for (let i = start; i <= end; i++) {
        const n = String(i).padStart(3, "0");
        const oldId = op + n;
        const newId = np + n;
        const oldKey = PREFIX + oldId;
        const newKey = PREFIX + newId;
        const raw = safeGetItem(oldKey);
        if (raw && !safeGetItem(newKey)) {
          const card = parseJSON(raw);
          if (card) { card.id = newId; safeSetItem(newKey, JSON.stringify(card)); }
        }
        safeRemoveItem(oldKey);
        safeRemoveItem(LEGACY_PREFIX + oldId);
      }
    });
    safeSetItem("ru_en_id_migration_v1", "done");
  }

  migrateCardIds();

  return { getCard, setCard, updateCard, getAllCards, getAllCardStates, getStats, recordStudySession, resetAll,
           getDailyGoal, setDailyGoal, getNewPerDay, setNewPerDay, getNewIntroducedToday, recordNewIntroduced,
           getTodayReviews, getCardsDueBy, getDueCountsByDate, getMasteredCount,
           getCustomWords, getAllGrammarProgress, addCustomWord, deleteCustomWord, getLastError };
})();
