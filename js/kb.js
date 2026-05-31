const KnowledgeBase = (() => {
  const STORAGE_KEY = "ru_en_kb";
  const SCHEMA_VERSION = 1;

  function emptySchema() {
    return {
      version: SCHEMA_VERSION,
      level: "",
      goal: "",
      weakPoints: [],
      sessions: [],
      masteredWordIds: [],
      pendingWords: [],
      nextLesson: "",
      profile: {
        level: "",
        goal: "",
        targetLevel: "B1",
        weeklyTime: "20 minutes/day, 5 days/week",
        preferredAI: "claude",
        plan: "",
      },
      vocabulary: [],
      curriculum: {
        completed: [],
        pending: [],
      },
      stats: {
        totalSessions: 0,
        lastUpdated: null,
      },
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeText(value, maxLength = 2000) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function containsHtmlAngles(value) {
    if (typeof value === "string") return value.indexOf("<") !== -1 || value.indexOf(">") !== -1;
    if (!value || typeof value !== "object") return false;
    if (Array.isArray(value)) return value.some(containsHtmlAngles);
    return Object.keys(value).some(key => containsHtmlAngles(value[key]));
  }

  function isValidLevel(level, allowEmpty = true) {
    return (allowEmpty && level === "") || ["A1", "A2", "B1", "B2", "C1"].includes(level);
  }

  function safeList(value, normalizer, maxItems = 200) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, maxItems).map(normalizer).filter(Boolean);
  }

  function normalizeProfile(profile) {
    const defaults = emptySchema().profile;
    const source = profile && typeof profile === "object" ? profile : {};
    return {
      level: isValidLevel(safeText(source.level || defaults.level, 20))
        ? safeText(source.level || defaults.level, 20)
        : defaults.level,
      goal: safeText(source.goal || defaults.goal, 200),
      targetLevel: safeText(source.targetLevel || defaults.targetLevel, 40),
      weeklyTime: safeText(source.weeklyTime || defaults.weeklyTime, 120),
      preferredAI: normalizeAI(source.preferredAI || defaults.preferredAI),
      plan: safeText(source.plan || defaults.plan, 1000),
    };
  }

  function normalizeAI(value) {
    const text = safeText(value, 40).toLowerCase();
    if (text.includes("chat") || text.includes("openai")) return "chatgpt";
    return "claude";
  }

  function normalizeSession(session) {
    if (!session || typeof session !== "object") return null;
    const topic = safeText(session.topic, 240);
    const raw = safeText(session.raw, 4000);
    if (!topic && !raw) return null;
    return {
      id: safeText(session.id, 80) || makeId(),
      date: safeText(session.date, 40) || todayISO(),
      duration: safeText(session.duration, 80),
      topic,
      newVocabulary: safeText(session.newVocabulary, 1000),
      grammarCovered: safeText(session.grammarCovered, 1000),
      errorsNoted: safeText(session.errorsNoted, 1000),
      fluencyRating: safeText(session.fluencyRating, 40),
      nextFocus: safeText(session.nextFocus, 1000),
      raw,
      createdAt: safeText(session.createdAt, 40) || new Date().toISOString(),
    };
  }

  function normalizeVocabulary(item) {
    if (!item || typeof item !== "object") return null;
    const term = safeText(item.term || item.word || item.en, 120);
    if (!term) return null;
    const seenCount = Math.max(1, parseInt(item.seenCount || item.frequency || 1, 10) || 1);
    return {
      term,
      translation: safeText(item.translation || item.ru, 160),
      mastery: Math.max(0, Math.min(5, Number(item.mastery) || 1)),
      seenCount,
      lastSeen: safeText(item.lastSeen, 40) || todayISO(),
    };
  }

  function normalizeWeakPoint(item) {
    if (!item || typeof item !== "object") return null;
    const pattern = safeText(item.pattern || item.text || item.error, 300);
    if (!pattern) return null;
    return {
      pattern,
      count: Math.max(1, parseInt(item.count || item.frequency || 1, 10) || 1),
      lastSeen: safeText(item.lastSeen, 40) || todayISO(),
    };
  }

  function normalizeCurriculum(curriculum) {
    const source = curriculum && typeof curriculum === "object" ? curriculum : {};
    return {
      completed: safeList(source.completed, item => safeText(item, 200), 100),
      pending: safeList(source.pending, item => safeText(item, 200), 100),
    };
  }

  function validate(data) {
    if (!data || typeof data !== "object") return emptySchema();
    const kb = emptySchema();
    kb.version = SCHEMA_VERSION;
    const profileSource = { ...(data.profile || {}) };
    if (typeof data.level === "string") profileSource.level = data.level;
    if (typeof data.goal === "string") profileSource.goal = data.goal;
    kb.profile = normalizeProfile(profileSource);
    kb.level = kb.profile.level;
    kb.goal = kb.profile.goal;
    kb.sessions = safeList(data.sessions, normalizeSession, 10);
    kb.vocabulary = safeList(data.vocabulary, normalizeVocabulary, 300);
    kb.weakPoints = safeList(data.weakPoints || data.weak_points, normalizeWeakPoint, 20);
    kb.masteredWordIds = safeList(data.masteredWordIds, item => {
      const text = safeText(item, 80);
      return text || null;
    }, 1000);
    kb.pendingWords = safeList(data.pendingWords, normalizeVocabulary, 100);
    kb.nextLesson = safeText(data.nextLesson, 1000);
    kb.curriculum = normalizeCurriculum(data.curriculum);
    kb.stats = {
      totalSessions: Math.max(
        kb.sessions.length,
        parseInt(data.stats && data.stats.totalSessions, 10) || 0
      ),
      lastUpdated: safeText(data.stats && data.stats.lastUpdated, 40) || null,
    };
    return kb;
  }

  function safeGetItem(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }

  function load() {
    const raw = safeGetItem(STORAGE_KEY);
    if (!raw) return emptySchema();
    try {
      return validate(JSON.parse(raw));
    } catch {
      return emptySchema();
    }
  }

  function save(kb) {
    const normalized = validate(kb);
    normalized.stats.totalSessions = normalized.sessions.length;
    normalized.stats.lastUpdated = new Date().toISOString();
    safeSetItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  function get() {
    return load();
  }

  function set(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "invalid_schema" };
    }
    const requestedLevel = typeof data.level === "string"
      ? safeText(data.level, 20)
      : safeText(data.profile && data.profile.level, 20);
    if (requestedLevel && !isValidLevel(requestedLevel, false)) {
      return { ok: false, error: "invalid_level" };
    }
    if (containsHtmlAngles(data)) {
      return { ok: false, error: "html_not_allowed" };
    }
    return { ok: true, kb: save(data) };
  }

  function reset() {
    return save(emptySchema());
  }

  function updateProfile(profilePatch) {
    const kb = load();
    kb.profile = normalizeProfile({ ...kb.profile, ...(profilePatch || {}) });
    return save(kb);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function makeId() {
    return `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function extractSummaryBlock(summaryText) {
    const text = typeof summaryText === "string" ? summaryText : "";
    const startMatch = text.match(/\[LESSON SUMMARY\]/i);
    if (!startMatch || startMatch.index === undefined) return null;
    const afterStart = startMatch.index + startMatch[0].length;
    const rest = text.slice(afterStart);
    const endMatch = rest.match(/\[END SUMMARY\]/i);
    if (!endMatch || endMatch.index === undefined) return null;
    return rest.slice(0, endMatch.index).trim();
  }

  function parseFields(block) {
    const fields = {};
    const aliases = {
      "date": "date",
      "duration": "duration",
      "topic": "topic",
      "new vocabulary": "newVocabulary",
      "vocabulary": "newVocabulary",
      "grammar covered": "grammarCovered",
      "grammar": "grammarCovered",
      "errors noted": "errorsNoted",
      "errors": "errorsNoted",
      "fluency rating": "fluencyRating",
      "fluency": "fluencyRating",
      "next focus": "nextFocus",
      "next": "nextFocus",
    };
    let lastKey = null;

    block.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const match = trimmed.match(/^([^:]{2,40}):\s*(.*)$/);
      if (match) {
        const key = aliases[match[1].trim().toLowerCase()];
        if (!key) {
          lastKey = null;
          return;
        }
        fields[key] = safeText(match[2], 1200);
        lastKey = key;
      } else if (lastKey) {
        fields[lastKey] = safeText(`${fields[lastKey]} ${trimmed}`, 1200);
      }
    });

    return fields;
  }

  function splitSummaryItems(text) {
    return safeText(text, 1200)
      .split(/[;\n]|,(?=\s*[A-Za-zА-Яа-яЁё])/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  function parseVocabulary(text) {
    return splitSummaryItems(text)
      .map(item => item.replace(/\(\s*\+\s*Russian translations\s*\)/ig, "").trim())
      .map(item => {
        const parts = item.split(/\s+[—–-]\s+|:/);
        const term = safeText(parts[0], 120);
        if (!term || /^\[.*\]$/.test(term)) return null;
        return {
          term,
          translation: safeText(parts.slice(1).join(" - "), 160),
        };
      })
      .filter(Boolean);
  }

  function upsertVocabulary(kb, vocabularyTextOrItems, date) {
    const existing = new Map(kb.vocabulary.map((item, index) => [item.term.toLowerCase(), index]));
    const items = Array.isArray(vocabularyTextOrItems)
      ? vocabularyTextOrItems
      : parseVocabulary(vocabularyTextOrItems);
    items.forEach(item => {
      const key = item.term.toLowerCase();
      if (existing.has(key)) {
        const current = kb.vocabulary[existing.get(key)];
        current.seenCount += 1;
        current.mastery = Math.min(5, current.mastery + 0.25);
        current.lastSeen = date;
        if (item.translation && !current.translation) current.translation = item.translation;
      } else {
        existing.set(key, kb.vocabulary.length);
        kb.vocabulary.push({
          term: item.term,
          translation: item.translation,
          mastery: 1,
          seenCount: 1,
          lastSeen: date,
        });
      }
    });
  }

  function upsertWeakPoints(kb, errorsText, date) {
    const items = splitSummaryItems(errorsText);
    const existing = new Map(kb.weakPoints.map((item, index) => [item.pattern.toLowerCase(), index]));
    items.forEach(patternText => {
      const pattern = safeText(patternText, 300);
      if (!pattern || /^none$/i.test(pattern)) return;
      const key = pattern.toLowerCase();
      if (existing.has(key)) {
        const current = kb.weakPoints[existing.get(key)];
        current.count += 1;
        current.lastSeen = date;
      } else {
        existing.set(key, kb.weakPoints.length);
        kb.weakPoints.push({ pattern, count: 1, lastSeen: date });
      }
    });
  }

  function addCurriculumItem(list, item) {
    const text = safeText(item, 200);
    if (!text) return;
    if (!list.some(existing => existing.toLowerCase() === text.toLowerCase())) {
      list.push(text);
    }
  }

  function updateFromSummary(summaryText) {
    const block = extractSummaryBlock(summaryText);
    if (!block) {
      return { ok: false, error: "summary_block_not_found", kb: load() };
    }

    const fields = parseFields(block);
    const requiredFields = ["topic", "newVocabulary", "errorsNoted", "nextFocus"];
    const missingFields = requiredFields.filter(key => !fields[key]);
    if (missingFields.length) {
      return { ok: false, error: "summary_fields_not_found", missingFields, kb: load() };
    }

    const kb = load();
    const sessionDate = safeText(fields.date, 40) || todayISO();
    const session = normalizeSession({
      id: makeId(),
      date: sessionDate,
      duration: fields.duration,
      topic: fields.topic || "Untitled lesson",
      newVocabulary: fields.newVocabulary,
      grammarCovered: fields.grammarCovered,
      errorsNoted: fields.errorsNoted,
      fluencyRating: fields.fluencyRating,
      nextFocus: fields.nextFocus,
      raw: block,
      createdAt: new Date().toISOString(),
    });

    kb.sessions.unshift(session);
    kb.sessions = kb.sessions.slice(0, 10);
    const vocabularyItems = parseVocabulary(session.newVocabulary);
    upsertVocabulary(kb, vocabularyItems, session.date);
    upsertWeakPoints(kb, session.errorsNoted, session.date);
    kb.weakPoints = kb.weakPoints.slice(-20);
    kb.pendingWords = vocabularyItems.filter(item => {
      const key = item.term.toLowerCase();
      return !kb.vocabulary.some(word => word.term.toLowerCase() === key && word.seenCount > 1);
    }).map(item => ({ ...item, mastery: 0, seenCount: 0, lastSeen: session.date }));
    kb.nextLesson = session.nextFocus;
    addCurriculumItem(kb.curriculum.completed, session.grammarCovered || session.topic);
    addCurriculumItem(kb.curriculum.pending, session.nextFocus);

    const saved = save(kb);
    return { ok: true, session, kb: saved, vocabularyCount: vocabularyItems.length };
  }

  function countWords(text) {
    return safeText(text, 20000).split(/\s+/).filter(Boolean).length;
  }

  function clampWords(text, maxWords) {
    const words = safeText(text, 20000).split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return text;
    return `${words.slice(0, maxWords).join(" ")} ...`;
  }

  function compressedSnapshot(maxWords = 500) {
    const limit = Math.max(1, parseInt(maxWords, 10) || 500);
    const kb = load();
    const profile = kb.profile;
    const recentSessions = kb.sessions.slice(0, 3)
      .map(s => `${s.date}: ${s.topic || "lesson"}`);
    const weak = kb.weakPoints
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(w => `${w.pattern} (${w.count})`);

    const lines = [
      `Profile: level ${profile.level || "not set"}; goal ${profile.goal || "not set"}.`,
      `Mastered word count: ${kb.masteredWordIds.length}.`,
      weak.length ? `Weak points to revisit: ${weak.join("; ")}.` : "Weak points to revisit: none recorded yet.",
      recentSessions.length ? `Last lesson topics: ${recentSessions.join(" | ")}.` : "Last lesson topics: none yet.",
      kb.nextLesson ? `Next focus: ${kb.nextLesson}.` : "",
    ].filter(Boolean);

    const snapshot = lines.join("\n");
    return countWords(snapshot) > limit ? clampWords(snapshot, limit) : snapshot;
  }

  function replaceAll(nextKb) {
    return save(nextKb);
  }

  // The parsed vocabulary of a stored lesson (most recent by default). Unlike
  // `pendingWords`, this always reflects the lesson as imported, so callers can
  // decide "is this already a flashcard?" from real card state instead of the
  // KB's own seenCount history.
  function lessonVocabulary(index = 0) {
    const kb = load();
    const session = kb.sessions[index];
    if (!session) return [];
    return parseVocabulary(session.newVocabulary);
  }

  return {
    STORAGE_KEY,
    defaults: emptySchema,
    validate,
    load,
    save,
    get,
    set,
    reset,
    replaceAll,
    updateProfile,
    updateFromSummary,
    lessonVocabulary,
    compressedSnapshot,
    _parseSummaryBlock: extractSummaryBlock,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = KnowledgeBase;
}

if (typeof globalThis !== "undefined") {
  globalThis.KnowledgeBase = KnowledgeBase;
}
