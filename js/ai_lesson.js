const AILesson = (() => {
  const LINKS = {
    claude: "https://claude.ai/new",
    chatgpt: "https://chat.openai.com/",
  };

  const DEFAULT_LESSON = {
    topic: "Free conversation and review",
    grammar: "Based on my weak points",
    vocabulary: "Useful words for today's topic",
    weakPoints: "Use the weak points from my profile",
    difficulty: "",
  };

  const PLACEMENT_PROMPT = `I want to assess my English level. Please test me across reading,
writing, and grammar with 10 questions of gradually increasing difficulty.
At the end, give me a CEFR level (A1–C1) with a 2-sentence explanation
in Russian. Conduct the test in English. Begin.`;

  const FLUENCY_STARS = ["", "★☆☆☆☆", "★★☆☆☆", "★★★☆☆", "★★★★☆", "★★★★★"];

  function sanitizeUserField(value) {
    const text = String(value || "");
    if (/\[SYSTEM\]|\[INST\]|<\|im_start\|>|```/i.test(text)) return "";
    return text
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);
  }

  function sanitizeSnapshot(value) {
    return String(value || "")
      .replace(/\[SYSTEM\]/ig, "")
      .replace(/\[INST\]/ig, "")
      .replace(/<\|im_start\|>/ig, "")
      .replace(/```/g, "")
      .trim();
  }

  function getDeepLink(ai) {
    if (ai === "chatgpt") return LINKS.chatgpt;
    return LINKS.claude;
  }

  // How much the tutor should lean on Russian vs. English, by CEFR level.
  // A complete beginner (A1 / no level set yet) gets mostly-Russian scaffolding
  // so the lesson never becomes an impenetrable wall of English.
  function languageGuidance(level) {
    const lvl = String(level || "").toUpperCase();
    if (lvl === "B2" || lvl === "C1") {
      return "The student is advanced. Conduct the lesson almost entirely in English; switch to Russian only rarely, to clarify a subtle nuance.";
    }
    if (lvl === "B1") {
      return "The student is intermediate. Speak mostly in English, but switch to Russian to explain any new word or grammar point when they struggle.";
    }
    if (lvl === "A2") {
      return "The student is an elementary learner. Speak about half in simple English and half in Russian. Give the Russian translation for every new or difficult word, and keep sentences short.";
    }
    return "The student is a near-complete beginner. Speak mostly in Russian (about 80%). Introduce only one or two English words or a short phrase at a time, and always say the Russian translation right after. Keep every English sentence very short and simple, go slowly, and repeat new words often.";
  }

  function buildPrompt(options = {}) {
    const kb = KnowledgeBase.load();
    const profileSnapshot = sanitizeSnapshot(KnowledgeBase.compressedSnapshot(500));
    const topic = sanitizeUserField(options.topic || DEFAULT_LESSON.topic) || DEFAULT_LESSON.topic;
    const grammar = sanitizeUserField(options.grammar || DEFAULT_LESSON.grammar) || DEFAULT_LESSON.grammar;
    const vocabulary = sanitizeUserField(Array.isArray(options.vocabulary) ? options.vocabulary.join(", ") : (options.vocabulary || DEFAULT_LESSON.vocabulary)) || DEFAULT_LESSON.vocabulary;
    const weakPoints = sanitizeUserField(options.weakPoints || DEFAULT_LESSON.weakPoints) || DEFAULT_LESSON.weakPoints;
    // One effective CEFR level drives both the difficulty line and the tutor's
    // language ratio, so a fresh user can't get "near-complete beginner"
    // guidance alongside "Difficulty: A2". Unset defaults to A1.
    const cefr = level => (String(level).toUpperCase().match(/\b(A1|A2|B1|B2|C1)\b/) || [])[0];
    const effectiveLevel = cefr(options.difficulty) || cefr(kb.profile.level) || "A1";
    const difficulty = sanitizeUserField(options.difficulty) || effectiveLevel;
    const guidance = languageGuidance(effectiveLevel);

    return `You are an English tutor for Russian speakers. ${guidance}
Correct errors gently and inline — acknowledge what they said, then model the
correct form, then ask them to try again. Never break character.

STUDENT PROFILE:
${profileSnapshot}

TODAY'S LESSON:
Topic: ${topic}
Target grammar: ${grammar}
New vocabulary to introduce: ${vocabulary}
Weak points to revisit: ${weakPoints}
Difficulty: ${difficulty}

At the very end of our conversation, after I say I want to finish,
produce a summary block formatted exactly like this:

[LESSON SUMMARY]
Date: [today]
Duration: [estimate]
Topic: [topic]
New vocabulary: [word — перевод, word — перевод]
Grammar covered: [what was taught]
Errors noted: [specific mistakes and corrections]
Fluency rating: [1-5]
Next focus: [recommendation]
[END SUMMARY]

Let's begin. Start by greeting me and asking how I'm feeling today in English.`;
  }

  // Strict tutor prompt for absolute beginners — prioritizes error correction
  // over encouragement. The AI still scaffolds in Russian (per languageGuidance)
  // so a true beginner is corrected without being buried in English.
  function buildBeginnerPrompt() {
    const kb = KnowledgeBase.load();
    const profileSnapshot = sanitizeSnapshot(KnowledgeBase.compressedSnapshot(500));
    const cefr = level => (String(level).toUpperCase().match(/\b(A1|A2|B1|B2|C1)\b/) || [])[0];
    const effectiveLevel = cefr(kb.profile.level) || "A1";
    const guidance = languageGuidance(effectiveLevel);

    return `You are a strict, caring English tutor for an absolute beginner Russian speaker (level ${effectiveLevel}). Your goal is real learning — not making the student feel comfortable. ${guidance}

STUDENT PROFILE:
${profileSnapshot}

CORRECTION RULES — follow every one:
1. When the student makes any error (wrong word, wrong word order, wrong article a/the, wrong verb form, wrong preposition), IMMEDIATELY name the specific rule they broke. Explain the rule in Russian so a beginner understands. Do not soften it. Example: "Неправильно — в английском артикль 'a' ставится перед новым предметом. Правило: 'I have a cat', не 'I have cat'. Повторите: I have a cat."
2. Do NOT move to the next item until the student has correctly repeated the target phrase at least once.
3. Never use hollow phrases like "Good try!", "Almost!", "Молодец!" without a correction immediately following. Better: skip the praise and give the correction directly.
4. If the student says "I understand" or "понятно" without demonstrating it, respond: "Покажите — составьте предложение с этим словом."

TEACHING RULES:
5. For every new word, always provide all three: the English word + a simple Russian transliteration of how it sounds + the Russian translation. Example: cat [кэт] — кошка.
6. Point out where Russian and English differ and trip up learners: articles (a/an/the), fixed word order (Subject–Verb–Object), no grammatical gender, auxiliary verbs in questions (do/does), and sounds that don't exist in Russian (th, the short "i", the "w" vs "v").
7. Prefer depth over breadth. Three words truly mastered beats ten words half-remembered.
8. After teaching any new concept, ask a comprehension question before continuing. Do not assume understanding.
9. Keep responses short: correct one thing at a time. Long responses overwhelm beginners.

FORMAT:
- Explain and instruct mostly in Russian (see the language ratio above).
- Use English only for the target words and phrases the student must learn.
- Always show new words as: English word + [transliteration] + Russian translation.

At the end of the conversation produce this block exactly:

[LESSON SUMMARY]
Date: [today]
Duration: [estimate]
Topic: [topic]
New vocabulary: [word — перевод, word — перевод]
Grammar covered: [what was taught]
Errors noted: [specific mistakes and corrections — be specific, not vague]
Fluency rating: [1-5]
Next focus: [recommendation]
[END SUMMARY]

Begin by greeting the student in English (with the Russian translation right after), then ask in Russian what they want to practice today, or invite them to say "begin" to let you choose.`;
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message, kind = "info") {
    const status = byId("ai-status");
    if (!status) return;
    status.textContent = message;
    status.className = `ai-status ai-status--${kind}`;
  }

  function startPlacementTest() {
    byId("ai-prompt-output").value = PLACEMENT_PROMPT;
    const resultField = byId("ai-placement-result-field");
    const resultInput = byId("ai-placement-result");
    const saveButton = byId("ai-save-placement");
    if (resultField) resultField.hidden = false;
    if (resultInput) resultInput.hidden = false;
    if (saveButton) saveButton.hidden = false;
    setStatus("Скопируйте промпт и пройдите тест в Claude или ChatGPT.", "info");
    return PLACEMENT_PROMPT;
  }

  function savePlacementLevel() {
    const resultText = byId("ai-placement-result").value;
    const match = resultText.match(/\b(A1|A2|B1|B2|C1)\b/i);
    if (!match) {
      setStatus("Не удалось найти уровень CEFR в результате теста.", "warning");
      return;
    }
    const level = match[1].toUpperCase();
    const kb = KnowledgeBase.updateProfile({ level });
    writeProfileForm(kb);
    renderKb();
    setStatus(`Уровень обновлён: ${level}.`, "success");
  }

  function readProfileForm() {
    return {
      level: byId("ai-level").value,
      goal: byId("ai-goal").value,
      targetLevel: byId("ai-target-level").value,
      weeklyTime: byId("ai-weekly-time").value,
      preferredAI: byId("ai-preferred").value,
      plan: byId("ai-plan").value,
    };
  }

  function writeProfileForm(kb) {
    byId("ai-level").value = kb.profile.level;
    byId("ai-goal").value = kb.profile.goal;
    byId("ai-target-level").value = kb.profile.targetLevel;
    byId("ai-weekly-time").value = kb.profile.weeklyTime;
    byId("ai-preferred").value = kb.profile.preferredAI;
    byId("ai-plan").value = kb.profile.plan;
  }

  function readLessonOptions() {
    return {
      topic: byId("ai-topic").value,
      grammar: byId("ai-grammar").value,
      vocabulary: byId("ai-vocabulary").value,
      weakPoints: byId("ai-weak-points").value,
      difficulty: byId("ai-difficulty").value,
    };
  }

  function writeLessonDefaults(kb) {
    if (!byId("ai-topic").value) byId("ai-topic").value = DEFAULT_LESSON.topic;
    if (!byId("ai-grammar").value) byId("ai-grammar").value = DEFAULT_LESSON.grammar;
    if (!byId("ai-vocabulary").value) byId("ai-vocabulary").value = DEFAULT_LESSON.vocabulary;
    if (!byId("ai-weak-points").value) byId("ai-weak-points").value = DEFAULT_LESSON.weakPoints;
    if (!byId("ai-difficulty").value) byId("ai-difficulty").value = kb.profile.level || "A2";
  }

  function autofillWeakPoints() {
    const kb = KnowledgeBase.load();
    if (!kb.weakPoints.length) {
      setStatus("Ошибок в базе знаний пока нет.", "warning");
      return;
    }
    const top = kb.weakPoints
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(w => w.pattern);
    byId("ai-weak-points").value = top.join("; ");
    setStatus("Ошибки заполнены из базы знаний.", "success");
  }

  function renderNextFocusBanner() {
    const kb = KnowledgeBase.load();
    const banner = byId("ai-next-focus-banner");
    const text = byId("ai-next-focus-text");
    if (!banner || !text) return;
    if (kb.nextLesson) {
      text.textContent = `Рекомендация после последнего урока: «${kb.nextLesson}»`;
      banner.hidden = false;
    } else {
      banner.hidden = true;
    }
  }

  function applyNextFocus() {
    const kb = KnowledgeBase.load();
    if (kb.nextLesson) {
      byId("ai-topic").value = kb.nextLesson;
      setStatus("Тема применена из рекомендации.", "success");
    }
    byId("ai-next-focus-banner").hidden = true;
  }

  function renderSessionHistory() {
    const kb = KnowledgeBase.load();
    const list = byId("ai-session-list");
    const countBadge = byId("ai-history-count");
    if (!list) return;

    countBadge.textContent = String(kb.sessions.length);

    if (!kb.sessions.length) {
      list.innerHTML = '<p class="ai-empty-state">Уроков пока нет. После урока добавьте конспект выше.</p>';
      return;
    }

    list.innerHTML = kb.sessions.map((s, i) => {
      const rating = parseInt(s.fluencyRating, 10);
      const stars = (rating >= 1 && rating <= 5) ? FLUENCY_STARS[rating] : "";
      const detailId = `ai-session-detail-${i}`;
      return `
        <div class="ai-session-item">
          <button class="ai-session-header" type="button" aria-expanded="false" aria-controls="${detailId}"
            data-detail-id="${detailId}">
            <span class="ai-session-date">${escapeHtml(s.date || "—")}</span>
            <span class="ai-session-topic">${escapeHtml(s.topic || "Урок")}</span>
            ${stars ? `<span class="ai-session-stars" title="Fluency">${stars}</span>` : ""}
            <span class="ai-session-chevron">›</span>
          </button>
          <div id="${detailId}" class="ai-session-detail" hidden>
            ${s.grammarCovered ? `<p><strong>Грамматика:</strong> ${escapeHtml(s.grammarCovered)}</p>` : ""}
            ${s.newVocabulary ? `<p><strong>Лексика:</strong> ${escapeHtml(s.newVocabulary)}</p>` : ""}
            ${s.errorsNoted ? `<p><strong>Ошибки:</strong> ${escapeHtml(s.errorsNoted)}</p>` : ""}
            ${s.nextFocus ? `<p><strong>Следующий фокус:</strong> ${escapeHtml(s.nextFocus)}</p>` : ""}
            ${s.duration ? `<p><strong>Длительность:</strong> ${escapeHtml(s.duration)}</p>` : ""}
          </div>
        </div>`;
    }).join("");

    list.querySelectorAll(".ai-session-header").forEach(button => {
      button.addEventListener("click", () => {
        const detail = byId(button.dataset.detailId);
        if (!detail) return;
        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        detail.hidden = expanded;
      });
    });
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderKb() {
    const kb = KnowledgeBase.load();
    byId("ai-kb-snapshot").value = KnowledgeBase.compressedSnapshot(500);
    byId("ai-kb-json").value = JSON.stringify(kb, null, 2);
    byId("ai-session-count").textContent = String(kb.sessions.length);
    byId("ai-vocab-count").textContent = String(kb.vocabulary.length);
    byId("ai-weak-count").textContent = String(kb.weakPoints.length);
    renderSessionHistory();
    renderNextFocusBanner();
  }

  function saveProfile() {
    const kb = KnowledgeBase.updateProfile(readProfileForm());
    writeProfileForm(kb);
    renderKb();
    setStatus("Профиль сохранён.", "success");
  }

  function generatePrompt() {
    saveProfile();
    const prompt = buildPrompt(readLessonOptions());
    byId("ai-prompt-output").value = prompt;
    setStatus("Промпт готов.", "success");
    return prompt;
  }

  async function copyPrompt() {
    const prompt = byId("ai-prompt-output").value || generatePrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setStatus("Промпт скопирован.", "success");
    } catch {
      byId("ai-prompt-output").focus();
      byId("ai-prompt-output").select();
      const copied = document.execCommand && document.execCommand("copy");
      setStatus(copied ? "Промпт скопирован." : "Скопируйте промпт вручную.", copied ? "success" : "warning");
    }
  }

  function openPreferredAI() {
    saveProfile();
    markLessonStarted();
    window.open(getDeepLink(byId("ai-preferred").value), "_blank", "noopener");
  }

  // ── First-lesson fast path ───────────────────────────────────────────────
  // We KNOW the user is a complete beginner, so the first few lessons skip the
  // placement test and the field-filling: force level A1 if unset, build the
  // strict-beginner prompt, copy it, open the AI, and point the learner at the
  // "paste your summary" panel. Surfaced one-tap from onboarding's final CTA.
  const FIRST_LESSON_TOPIC = "Greetings and introducing yourself";
  const PENDING_KEY = "ru_en_pending_summary";

  function markLessonStarted() {
    try { localStorage.setItem(PENDING_KEY, String(Date.now())); } catch {}
  }
  function clearPendingSummary() {
    try { localStorage.removeItem(PENDING_KEY); } catch {}
  }
  function hasPendingSummary() {
    try { return !!localStorage.getItem(PENDING_KEY); } catch { return false; }
  }

  function scrollToSummaryPanel() {
    const el = byId("ai-summary-input");
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function startFirstLesson() {
    showAiView();
    if (!KnowledgeBase.load().profile.level) {
      KnowledgeBase.updateProfile({ level: "A1" });
      writeProfileForm(KnowledgeBase.load());
    }
    const topicInput = byId("ai-topic");
    if (topicInput && !topicInput.value.trim()) {
      topicInput.value = KnowledgeBase.load().nextLesson || FIRST_LESSON_TOPIC;
    }
    const prompt = buildBeginnerPrompt();
    byId("ai-prompt-output").value = prompt;
    await copyPrompt();
    markLessonStarted();
    window.open(getDeepLink(byId("ai-preferred").value), "_blank", "noopener");
    setStatus("Промпт скопирован, AI открыт. Поговорите с тренером, затем вставьте конспект урока ниже 👇", "success");
    scrollToSummaryPanel();
  }

  const REQUIRED_FIELDS = {
    topic: "Тема",
    newVocabulary: "Лексика",
    errorsNoted: "Ошибки",
    nextFocus: "Следующий фокус",
  };

  function importSummary() {
    const result = KnowledgeBase.updateFromSummary(byId("ai-summary-input").value);
    if (!result.ok) {
      if (result.error === "summary_block_not_found") {
        setStatus("Не нашёл блок [LESSON SUMMARY] ... [END SUMMARY]. Скопируйте конспект из чата полностью.", "warning");
        return;
      }
      if (result.error === "summary_fields_not_found") {
        const missing = (result.missingFields || [])
          .filter(key => REQUIRED_FIELDS[key])
          .map(key => REQUIRED_FIELDS[key]);
        const msg = missing.length
          ? `Не хватает полей: ${missing.join(", ")}.`
          : "Не удалось распознать обязательные поля конспекта.";
        setStatus(msg, "warning");
        return;
      }
      setStatus("Конспект не распознан. Проверьте формат.", "warning");
      return;
    }
    byId("ai-summary-input").value = "";
    clearPendingSummary();
    renderKb();
    writeLessonDefaults(result.kb);
    // Close the loop in one step: the words the lesson just taught become due
    // SRS cards immediately, so the AI lesson and the deck reinforce each other
    // without the learner needing a second tap.
    const added = addLessonWordsToCards();
    const lessonNo = result.kb.sessions.length;
    setStatus(
      `🎉 Урок №${lessonNo} сохранён. Новых слов: ${result.vocabularyCount || 0}; добавлено в карточки: ${added || 0}.`,
      "success"
    );
    if (typeof renderHome === "function") renderHome();
  }

  // Idea #1: turn the words from the just-imported lesson into real SRS
  // flashcards, so the AI lesson and the spaced-repetition deck reinforce each
  // other. No network — just reuses the local custom-word + SRS storage.
  function addLessonWordsToCards() {
    if (typeof Storage === "undefined" || !Storage.addCustomWord) {
      setStatus("Не удалось получить доступ к карточкам.", "warning");
      return 0;
    }

    // Source from the most recently imported lesson; whether each word is
    // "new" is decided below against actual card state, not the KB's history.
    const candidates = KnowledgeBase.lessonVocabulary().filter(item => item && item.term && item.translation);
    if (!candidates.length) {
      setStatus("Нет новых слов из урока. Сначала добавьте конспект урока.", "warning");
      return 0;
    }

    // Skip words already in the built-in list or the user's custom words.
    const existing = new Set();
    const core = (typeof VOCABULARY !== "undefined" ? VOCABULARY : []);
    core.concat(Storage.getCustomWords()).forEach(word => existing.add(String(word.en || "").toLowerCase()));

    let added = 0;
    let skipped = 0;
    candidates.forEach(item => {
      const en = String(item.term).trim();
      const ru = String(item.translation).trim();
      if (!en || !ru || existing.has(en.toLowerCase())) { skipped++; return; }

      const word = Storage.addCustomWord(ru, en, "AI-урок");
      existing.add(en.toLowerCase());
      // Seed an SRS card due now so a freshly-learned word can be practised right
      // away instead of waiting behind the daily new-word limit.
      if (word && typeof SRS !== "undefined" && Storage.setCard) {
        Storage.setCard(SRS.createCard(word.id));
      }
      added++;
    });

    // No state to clear: words just added are now real cards, so the dedup
    // above makes a second tap a no-op on its own.
    if (typeof populateCategoryFilter === "function") populateCategoryFilter();
    if (typeof renderHome === "function") renderHome();
    if (byId("ai-kb-snapshot")) renderKb();

    const skippedMsg = skipped ? ` Пропущено (уже есть): ${skipped}.` : "";
    setStatus(
      added ? `Добавлено в карточки: ${added}.${skippedMsg}` : `Новых слов не добавлено.${skippedMsg}`,
      added ? "success" : "warning"
    );
    return added;
  }

  function saveJson() {
    try {
      const parsed = JSON.parse(byId("ai-kb-json").value);
      const kb = KnowledgeBase.replaceAll(parsed);
      writeProfileForm(kb);
      renderKb();
      setStatus("База знаний обновлена.", "success");
    } catch {
      setStatus("JSON не сохранён: проверьте формат.", "warning");
    }
  }

  function resetKb() {
    showModal({
      message: "Сбросить AI-базу знаний? Карточки SRS не будут затронуты.",
      confirmText: "Сбросить",
      danger: true,
      onConfirm: () => {
        const kb = KnowledgeBase.reset();
        writeProfileForm(kb);
        renderKb();
        setStatus("AI-база знаний сброшена.", "warning");
      },
    });
  }

  function showAiView() {
    const studyView = byId("view-study");
    if (studyView && studyView.classList.contains("active") && typeof finalizeStudySession === "function") {
      finalizeStudySession();
    }
    if (typeof Speech !== "undefined" && Speech.cancel) Speech.cancel();
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.querySelectorAll("nav button").forEach(button => button.classList.remove("active"));
    byId("view-ai-lesson").classList.add("active");
    byId("nav-ai-lesson").classList.add("active");
    renderKb();
  }

  function hideAiView() {
    const view = byId("view-ai-lesson");
    const nav = byId("nav-ai-lesson");
    if (view) view.classList.remove("active");
    if (nav) nav.classList.remove("active");
  }

  function init() {
    if (!byId("view-ai-lesson")) return;

    const kb = KnowledgeBase.load();
    writeProfileForm(kb);
    writeLessonDefaults(kb);
    renderKb();

    byId("nav-ai-lesson").addEventListener("click", showAiView);
    document.querySelectorAll("nav button[data-view]").forEach(button => {
      button.addEventListener("click", hideAiView);
    });
    byId("ai-save-profile").addEventListener("click", saveProfile);
    byId("ai-generate-prompt").addEventListener("click", generatePrompt);
    const beginnerBtn = byId("ai-beginner-prompt");
    if (beginnerBtn) {
      beginnerBtn.addEventListener("click", () => {
        saveProfile();
        byId("ai-prompt-output").value = buildBeginnerPrompt();
        setStatus("Промпт «Тренер для начинающих» готов — строгие исправления, без пустой похвалы.", "success");
      });
    }
    byId("ai-copy-prompt").addEventListener("click", copyPrompt);
    byId("ai-open-ai").addEventListener("click", openPreferredAI);
    byId("ai-import-summary").addEventListener("click", importSummary);
    const addWordsBtn = byId("ai-add-words-to-cards");
    if (addWordsBtn) addWordsBtn.addEventListener("click", addLessonWordsToCards);
    byId("ai-refresh-kb").addEventListener("click", renderKb);
    byId("ai-save-json").addEventListener("click", saveJson);
    byId("ai-reset-kb").addEventListener("click", resetKb);
    byId("ai-autofill-weak").addEventListener("click", autofillWeakPoints);
    byId("ai-apply-next-focus").addEventListener("click", applyNextFocus);
    byId("ai-dismiss-banner").addEventListener("click", () => { byId("ai-next-focus-banner").hidden = true; });
    byId("ai-placement-btn").addEventListener("click", startPlacementTest);
    byId("ai-save-placement").addEventListener("click", savePlacementLevel);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }

  return {
    buildPrompt,
    buildBeginnerPrompt,
    getDeepLink,
    sanitizeUserField,
    startPlacementTest,
    savePlacementLevel,
    addLessonWordsToCards,
    startFirstLesson,
    hasPendingSummary,
    languageGuidance,
    init,
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AILesson;
}

if (typeof globalThis !== "undefined") {
  globalThis.AILesson = AILesson;
}
