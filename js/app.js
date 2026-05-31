// ── State ──────────────────────────────────────────────────
// Beginners start RU→EN: they see the familiar Russian word and recall the
// English one. The known language is always the prompt, which keeps early
// lessons in Russian and lowers the barrier to entry.
let currentMode = "ru-en";
let currentSkill = "flashcard";
let typingModeEnabled = false;
let typingAnswerChecked = false;
let sessionQueue = [];
let sessionIndex = 0;
let sessionStats = { again: 0, hard: 0, good: 0, easy: 0 };
let sessionRequeues = new Map();
let sessionFinalized = true;
let isFlipped = false;
let currentDirection = "ru-en";
let selectedCategory = "";
let hintUsed = false;
let listeningInEnglish = false;
let speakEnSentenceMode = false;
let speakEnFallback = false;
let pendingAdvanceTimer = null;

// ── DOM refs ────────────────────────────────────────────────
const views = {
  home:    document.getElementById("view-home"),
  study:   document.getElementById("view-study"),
  stats:   document.getElementById("view-stats"),
  grammar: document.getElementById("view-grammar"),
};
const navBtns = document.querySelectorAll("nav button[data-view]");

// ── Navigation ───────────────────────────────────────────────
function showView(name) {
  if (name !== "study") clearSessionTimers();
  Speech.cancel();
  Object.values(views).forEach(v => v.classList.remove("active"));
  views[name].classList.add("active");
  navBtns.forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "home")    renderHome();
  if (name === "stats")   renderStats();
  if (name === "grammar") renderGrammarList();
}

function getSessionReviewCount() {
  return sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;
}

function finalizeStudySession() {
  if (sessionFinalized) return;
  const reviewCount = getSessionReviewCount();
  if (reviewCount > 0) Storage.recordStudySession(reviewCount);
  sessionFinalized = true;
}

function clearSessionTimers() {
  if (!pendingAdvanceTimer) return;
  clearTimeout(pendingAdvanceTimer);
  pendingAdvanceTimer = null;
}

function scheduleSessionAdvance(callback, delay) {
  clearSessionTimers();
  pendingAdvanceTimer = setTimeout(() => {
    pendingAdvanceTimer = null;
    callback();
  }, delay);
}

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Wrong-answer explanation: shows the correct word, transliteration, English
// meaning, and an example so a beginner learns from the miss instead of just
// being told they were wrong. `label` adapts the lead-in per quiz mode.
function showQuizErrorHint(hintEl, word, label) {
  if (!hintEl) return;
  const exLine = word.example
    ? `<span class="qeh-example">${escapeHtml(word.example.en)} — ${escapeHtml(word.example.ru)}</span>`
    : "";
  const translit = word.translit
    ? `<span class="qeh-pinyin">[${escapeHtml(word.translit)}]</span>`
    : "";
  hintEl.innerHTML =
    `<span class="qeh-label">${escapeHtml(label)}</span>` +
    `<span class="qeh-word">${escapeHtml(word.ru)}</span>` +
    `${translit} — ${escapeHtml(word.en)}${exLine}`;
  hintEl.classList.remove("hidden");
}

function hideQuizErrorHint(hintEl) {
  if (hintEl) hintEl.classList.add("hidden");
}

function isVocabularyWord(id) {
  return allWords().some(w => w.id === id);
}

function recordCardReview(id, grade) {
  const wasNew = !Storage.getCard(id);
  const updated = Storage.updateCard(id, grade);
  if (!updated) return false;
  // Count a card against the daily new-word allowance the first time it is rated,
  // but only for real vocabulary/custom words — the allowance (getDueCards) only
  // ever introduces those. Sentences (reading / speaking-EN sentence mode) are
  // also reviewed through here and must not silently drain the vocab budget.
  if (wasNew && isVocabularyWord(id)) Storage.recordNewIntroduced(1);
  sessionStats[["again", "hard", "good", "easy"][grade]]++;
  return true;
}

function renderNoCardsDue(message = "Сегодня нет карточек к повторению.") {
  sessionFinalized = true;
  hideAllStudySubAreas();
  const area = document.getElementById("session-summary-area");
  area.classList.remove("hidden");
  area.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "session-summary card";

  const title = document.createElement("h2");
  title.textContent = "Всё готово";

  const text = document.createElement("p");
  text.textContent = message;

  const homeBtn = document.createElement("button");
  homeBtn.className = "study-btn summary-home-btn";
  homeBtn.textContent = "На главную";
  homeBtn.addEventListener("click", () => showView("home"));

  summary.append(title, text, homeBtn);
  area.appendChild(summary);
}

navBtns.forEach(btn => btn.addEventListener("click", () => {
  const target = btn.dataset.view;
  if (views.study.classList.contains("active") && target !== "study") {
    finalizeStudySession();
  }
  if (target === "study" && sessionFinalized) {
    startSkillSession("flashcard");
    return;
  }
  showView(target);
}));

// ── Card helpers ─────────────────────────────────────────────
function allWords() {
  return [...VOCABULARY, ...Storage.getCustomWords()];
}

// Beginner-friendly order in which brand-new words are introduced. The first
// categories are the highest-utility, easiest ones; anything not listed
// (including custom words) is introduced last.
const CATEGORY_ORDER = [
  "greetings", "numbers", "family", "food", "phrases", "social phrases",
  "colors", "days", "time", "places", "verbs", "adjectives", "body",
  "clothing", "transport", "weather", "emotions", "home", "nature",
  "work", "health", "education", "shopping", "verbs2", "adjectives2",
  "travel", "travel phrases",
];

function categoryRank(word) {
  const i = CATEGORY_ORDER.indexOf(word.category);
  const base = i === -1 ? CATEGORY_ORDER.length : i;
  // The "numbers" category holds 100 entries (1–100). Introducing all of them up
  // front — numbers is the 2nd category — would trap a beginner on numbers for
  // ~10 days before reaching family/food/phrases. Keep 1–20 early; push the
  // compound/large numbers (21–100) to the very end so high-utility, everyday
  // vocabulary is learned first.
  if (word.category === "numbers") {
    const n = parseInt(String(word.id).replace(/\D/g, ""), 10);
    if (n > 20) return CATEGORY_ORDER.length + 1;
  }
  return base;
}

// All words sorted into the beginner introduction order (stable).
function orderedWords() {
  return allWords()
    .map((word, idx) => ({ word, idx }))
    .sort((a, b) => (categoryRank(a.word) - categoryRank(b.word)) || (a.idx - b.idx))
    .map(o => o.word);
}

// Returns the cards to study now: every review that is genuinely due, plus a
// limited number of brand-new words (capped per day). Without this cap a fresh
// learner would see all ~600 words as "due" at once.
//
// `includeNew` (default true) gates the brand-new words. Flashcards are the one
// place a beginner first *meets* a word, so only the flashcard plan introduces
// new vocabulary. The reinforcement modes (listening, speaking, text-quiz) pass
// includeNew:false so they only drill words the learner has already seen —
// otherwise tapping "Listening" first would teach unseen words by audio alone
// and silently spend the daily new-word budget.
function getDueCards({ includeNew = true } = {}) {
  const reviewDue = [];
  const newCandidates = [];

  orderedWords().forEach(word => {
    if (selectedCategory && word.category !== selectedCategory) return;
    const card = Storage.getCard(word.id);
    if (card) {
      if (SRS.isDue(card)) reviewDue.push(word);
    } else {
      newCandidates.push(word);
    }
  });

  if (!includeNew) return reviewDue;

  const allowance = Math.max(0, Storage.getNewPerDay() - Storage.getNewIntroducedToday());
  return [...reviewDue, ...newCandidates.slice(0, allowance)];
}

function buildQueue(words) {
  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Picks `count` distractor words for a multiple-choice question whose displayed
// text (`displayField`, e.g. "en" or "ru") differs from the answer's and from
// each other. Several words share a translation ("good / fine / well"), so a
// naive id-only filter could render two identical-looking buttons — one of which
// is then marked wrong. Falls back to fewer distractors if the pool is too small.
function pickDistractors(answer, displayField, count) {
  const seen = new Set([answer[displayField]]);
  const picked = [];
  for (const w of buildQueue(allWords().filter(word => word.id !== answer.id))) {
    if (seen.has(w[displayField])) continue;
    seen.add(w[displayField]);
    picked.push(w);
    if (picked.length === count) break;
  }
  return picked;
}

// ── Home view ────────────────────────────────────────────────
function renderHome() {
  const due = getDueCards().length;
  const stats = Storage.getStats();
  const cards = Storage.getAllCards();
  const learned = cards.filter(c => c.repetitions > 0).length;

  document.getElementById("stat-streak").textContent  = stats.streak;
  document.getElementById("stat-learned").textContent = learned;
  document.getElementById("stat-due").textContent     = due;
  document.getElementById("skill-due-count").textContent = due;

  const flashcardBtn = document.getElementById("start-flashcard-btn");
  if (due === 0) {
    flashcardBtn.disabled = true;
    flashcardBtn.style.background = "var(--good)";
    flashcardBtn.style.opacity = "1";
    flashcardBtn.textContent = "Всё изучено ✓";
  } else {
    flashcardBtn.disabled = false;
    flashcardBtn.style.background = "";
    flashcardBtn.style.opacity = "1";
    flashcardBtn.textContent = `Начать [${due} к повторению]`;
  }

  const listeningBtn = document.getElementById("start-listening-btn");
  const canPlayAudio = Speech.canSpeak();
  listeningBtn.disabled      = !canPlayAudio;
  listeningBtn.style.opacity = canPlayAudio ? "1" : "0.5";
  document.getElementById("listen-unsupported-msg").style.display = canPlayAudio ? "none" : "block";

  if (!Speech.canRecognize()) {
    document.getElementById("speak-unsupported-msg").style.display = "block";
    document.getElementById("speak-en-unsupported-msg").style.display = "block";
  }

  const goal      = Storage.getDailyGoal();
  const todayDone = Storage.getTodayReviews();
  const pct       = Math.min(100, Math.round((todayDone / goal) * 100));
  document.getElementById("daily-goal-fill").style.width = `${pct}%`;
  document.getElementById("daily-goal-text").textContent = `${todayDone} / ${goal}`;
  document.getElementById("new-per-day-text").textContent = Storage.getNewPerDay();

  renderCustomWords();
  renderNextStep();
  renderBanners();
}

// A single, prioritized "do this next" recommendation for the home screen.
// Beginners face a flat grid of 6+ skills and don't know where to start; the
// onboarding's recommended path is shown once and then forgotten. This surfaces
// the next sensible action: learn/review in flashcards while words are pending,
// then steer toward an AI lesson once the deck is caught up (the AI tutor is the
// app's centerpiece for an engaged beginner).
function renderNextStep() {
  const card = document.getElementById("next-step-card");
  const textEl = document.getElementById("next-step-text");
  const btn = document.getElementById("next-step-btn");
  if (!card || !textEl || !btn) return;

  const learned = Storage.getAllCards().filter(c => c.repetitions > 0).length;
  const plan = getDueCards();                          // flashcard plan (reviews + new)
  const reviews = getDueCards({ includeNew: false }).length;
  const newCount = plan.length - reviews;

  let text, btnText, action;

  // First few lessons are AI-driven for a complete beginner: the AI tutor is the
  // front door, and the SRS deck reinforces the words each lesson surfaces. Once
  // the learner has a few lessons under their belt, fall back to the deck-first
  // recommendation below.
  const FIRST_LESSONS = 3;
  const kb = typeof KnowledgeBase !== "undefined" ? KnowledgeBase.load() : null;
  const sessionCount = kb ? kb.sessions.length : 0;
  const startAiLesson = () => {
    if (typeof AILesson !== "undefined" && AILesson.startFirstLesson) AILesson.startFirstLesson();
    else { const nav = document.getElementById("nav-ai-lesson"); if (nav) nav.click(); }
  };

  if (sessionCount < FIRST_LESSONS) {
    if (sessionCount === 0) {
      text = "Начните здесь: первый урок с AI-тренером. Мы откроем AI и вставим готовый промпт для начинающих — заполнять ничего не нужно.";
      btnText = "Начать первый урок";
    } else {
      text = `Отличное начало — пройдено уроков: ${sessionCount}. Продолжайте с AI-тренером: первые несколько уроков важнее всего.`;
      btnText = "Начать следующий урок";
    }
    textEl.textContent = text;
    btn.textContent = btnText;
    btn.onclick = startAiLesson;
    card.hidden = false;
    return;
  }

  if (plan.length > 0) {
    if (learned === 0) {
      text = "Начните здесь: выучите первые слова в «Карточках» (тема «Приветствия»). Несколько слов в день — этого достаточно.";
    } else if (reviews > 0 && newCount > 0) {
      text = `${reviews} слов на повторение и ${newCount} новых готовы в «Карточках».`;
    } else if (newCount > 0) {
      text = `${newCount} новых слов готовы к изучению в «Карточках».`;
    } else {
      text = `${reviews} слов ждут повторения в «Карточках».`;
    }
    btnText = "Открыть карточки";
    action = () => startSkillSession("flashcard");
  } else {
    // Deck is caught up for today → point an engaged beginner at the AI tutor.
    const level = typeof KnowledgeBase !== "undefined"
      ? String(KnowledgeBase.load().profile.level || "").trim()
      : "";
    if (!level) {
      text = "Вы всё повторили на сегодня! 🎉 Узнайте свой уровень — пройдите тест уровня с AI-тренером.";
      btnText = "Перейти к AI-уроку";
    } else {
      text = "Вы всё повторили на сегодня! 🎉 Закрепите всё в живом диалоге с AI-тренером.";
      btnText = "Начать AI-урок";
    }
    action = () => { const nav = document.getElementById("nav-ai-lesson"); if (nav) nav.click(); };
  }

  textEl.textContent = text;
  btn.textContent = btnText;
  btn.onclick = action;
  card.hidden = false;
}

function renderBanners() {
  const homeView = document.getElementById("view-home");
  ["banner-streak-rescue", "banner-daily-nudge", "banner-pending-summary"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  const stats = Storage.getStats();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
  const todayReviews = Storage.getTodayReviews();
  const skillGrid = homeView.querySelector(".skill-grid");

  // After a lesson is opened, remind the learner to paste the summary back so the
  // AI keeps building their learning history. Cleared when a summary is imported.
  if (typeof AILesson !== "undefined" && AILesson.hasPendingSummary && AILesson.hasPendingSummary()) {
    const banner = document.createElement("div");
    banner.id = "banner-pending-summary";
    banner.className = "banner banner--info";
    banner.style.cursor = "pointer";
    banner.textContent = "📋 Сохраните конспект последнего урока, чтобы AI помнил ваш прогресс.";
    banner.addEventListener("click", () => {
      const nav = document.getElementById("nav-ai-lesson");
      if (nav) nav.click();
      const el = document.getElementById("ai-summary-input");
      if (el && typeof el.scrollIntoView === "function") el.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    homeView.insertBefore(banner, skillGrid);
  }

  if (stats.streak > 0 && stats.lastStudyDate === yesterdayStr && todayReviews === 0) {
    const banner = document.createElement("div");
    banner.id = "banner-streak-rescue";
    banner.className = "banner banner--warning";
    banner.textContent = `⚠️ Учитесь сегодня, чтобы сохранить серию ${stats.streak} дней!`;
    homeView.insertBefore(banner, skillGrid);
  }

  if (todayReviews === 0 && new Date().getHours() >= 18) {
    const banner = document.createElement("div");
    banner.id = "banner-daily-nudge";
    banner.className = "banner banner--info";
    banner.textContent = "Вы ещё не занимались сегодня. Даже 5 минут помогут!";
    banner.style.cursor = "pointer";
    banner.addEventListener("click", () => banner.remove());
    homeView.insertBefore(banner, skillGrid);
  }
}

// ── Skill grid wiring ─────────────────────────────────────────
document.querySelectorAll("#flashcard-mode-select button").forEach(btn => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll("#flashcard-mode-select button").forEach(b =>
      b.classList.toggle("active", b.dataset.mode === currentMode)
    );
  });
});

document.getElementById("typing-mode-toggle").addEventListener("change", e => {
  typingModeEnabled = e.target.checked;
});

document.getElementById("start-flashcard-btn").addEventListener("click", () => {
  if (getDueCards().length === 0) return;
  startSkillSession("flashcard");
});

document.getElementById("start-listening-btn").addEventListener("click", () => {
  if (!Speech.canSpeak()) {
    document.getElementById("listen-unsupported-msg").style.display = "block";
    return;
  }
  startSkillSession("listening");
});

document.getElementById("start-speaking-btn").addEventListener("click", () => {
  if (!Speech.canRecognize()) {
    document.getElementById("speak-unsupported-msg").style.display = "block";
    return;
  }
  startSkillSession("speaking");
});

document.getElementById("start-reading-btn").addEventListener("click", () => {
  startSkillSession("reading");
});

// ── Study area management ─────────────────────────────────────
const STUDY_AREAS = [
  "flashcard-wrapper", "speaker-btn", "speaker-btn-en", "writing-input-area",
  "rating-buttons", "listening-quiz-area", "speaking-area", "speaking-en-area",
  "reading-area", "text-quiz-area", "session-summary-area",
];

function hideAllStudySubAreas() {
  STUDY_AREAS.forEach(id => document.getElementById(id).classList.add("hidden"));
}

function startSkillSession(skill) {
  clearSessionTimers();
  currentSkill = skill;
  sessionStats = { again: 0, hard: 0, good: 0, easy: 0 };
  sessionRequeues = new Map();
  sessionFinalized = false;
  hideAllStudySubAreas();
  showView("study");

  if (skill === "flashcard") {
    const due = getDueCards();
    if (due.length === 0) {
      const categoryName = selectedCategory ? ` в теме «${selectedCategory}»` : "";
      renderNoCardsDue(`Нет карточек к повторению${categoryName}.`);
      return;
    }
    sessionQueue = buildQueue(due);
    sessionIndex = 0;
    document.getElementById("flashcard-wrapper").classList.remove("hidden");
    document.getElementById("speaker-btn").classList.remove("hidden");
    renderCard();
  } else if (skill === "listening") {
    startListeningSession();
  } else if (skill === "speaking") {
    startSpeakingSession();
  } else if (skill === "reading") {
    startReadingSession();
  } else if (skill === "text-quiz") {
    startTextQuizSession();
  } else if (skill === "speaking-en") {
    startSpeakingEnSession();
  }
}

// ── Flashcard session ─────────────────────────────────────────
function getDirection() {
  if (currentMode === "mixed") return Math.random() < 0.5 ? "en-ru" : "ru-en";
  return currentMode;
}

function renderCard() {
  if (sessionIndex >= sessionQueue.length) {
    renderSessionSummary();
    return;
  }

  const word = sessionQueue[sessionIndex];
  const dir  = getDirection();
  currentDirection = dir;
  const front = dir === "en-ru" ? word.en : word.ru;
  const back  = dir === "en-ru" ? word.ru : word.en;
  const speakerBtn   = document.getElementById("speaker-btn");
  const speakerBtnEn = document.getElementById("speaker-btn-en");

  document.getElementById("card-front-word").textContent    = front;
  document.getElementById("card-front-hint").textContent    = "Нажмите, чтобы открыть";
  document.getElementById("card-back-word").textContent     = back;
  document.getElementById("card-back-translit").textContent = dir === "en-ru" ? word.translit : "";
  document.getElementById("card-category").textContent      = word.category;
  document.getElementById("card-category-back").textContent = word.category;
  document.getElementById("progress-text").textContent      = `${sessionIndex + 1} / ${sessionQueue.length}`;

  const phoneticEl = document.getElementById("card-back-phonetic");
  if (word.phonetic) {
    phoneticEl.textContent = word.phonetic;
    phoneticEl.classList.remove("hidden");
  } else {
    phoneticEl.textContent = "";
    phoneticEl.classList.add("hidden");
  }

  // A short example sentence on the back gives a beginner context to anchor the
  // word in, which aids recall far more than the bare translation.
  const exampleEl = document.getElementById("card-back-example");
  if (word.example && word.example.en) {
    exampleEl.innerHTML =
      `<span class="card-example-en">${escapeHtml(word.example.en)}</span>` +
      (word.example.ru ? `<span class="card-example-ru">${escapeHtml(word.example.ru)}</span>` : "");
    exampleEl.classList.remove("hidden");
  } else {
    exampleEl.innerHTML = "";
    exampleEl.classList.add("hidden");
  }

  document.getElementById("flashcard").classList.remove("flipped");
  isFlipped = false;
  typingAnswerChecked = false;
  hintUsed = false;
  document.getElementById("rating-buttons").classList.add("hidden");
  speakerBtn.classList.toggle("hidden", dir !== "ru-en");
  speakerBtnEn.classList.add("hidden");

  if (typingModeEnabled) {
    const inputArea = document.getElementById("writing-input-area");
    inputArea.classList.remove("hidden");
    document.getElementById("writing-input").value = "";
    const fb = document.getElementById("writing-feedback");
    fb.className = "writing-feedback hidden";
    fb.textContent = "";
  } else {
    document.getElementById("writing-input-area").classList.add("hidden");
  }

  if (dir === "ru-en" && Speech.canSpeak()) Speech.speakRussian(word.ru);
  if (dir === "en-ru" && Speech.canSpeak()) Speech.speakEnglish(word.en);
}

document.getElementById("flashcard-wrapper").addEventListener("click", flipCard);

function flipCard() {
  if (isFlipped) return;
  if (typingModeEnabled && !typingAnswerChecked) return;
  isFlipped = true;
  document.getElementById("flashcard").classList.add("flipped");
  document.getElementById("rating-buttons").classList.remove("hidden");
  if (currentDirection === "en-ru") {
    document.getElementById("speaker-btn").classList.remove("hidden");
  }
  document.getElementById("speaker-btn-en").classList.remove("hidden");
}

document.getElementById("speaker-btn").addEventListener("click", e => {
  e.stopPropagation();
  const word = sessionQueue[sessionIndex];
  if (word && Speech.canSpeak()) Speech.speakRussian(word.ru);
});

document.getElementById("speaker-btn-en").addEventListener("click", e => {
  e.stopPropagation();
  const word = sessionQueue[sessionIndex];
  if (word && Speech.canSpeak()) Speech.speakEnglish(word.en);
});

document.querySelectorAll("#rating-buttons .rating-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const grade = parseInt(btn.dataset.grade, 10);
    const word  = sessionQueue[sessionIndex];
    if (!word || !recordCardReview(word.id, grade)) return;

    if (grade === 0) {
      const count = (sessionRequeues.get(word.id) || 0) + 1;
      sessionRequeues.set(word.id, count);
      if (count <= 2) {
        const retryIndex = Math.min(sessionIndex + 3, sessionQueue.length);
        sessionQueue.splice(retryIndex, 0, word);
      }
    }

    sessionIndex++;
    renderCard();
  });
});

// ── Writing mode ───────────────────────────────────────────────
function getAcceptedAnswers(word) {
  if (currentDirection === "en-ru") return [word.ru];

  const answers = word.en.split("/").flatMap(part => {
    const trimmed = part.trim();
    const withoutParenthetical = trimmed.replace(/\s*\([^)]*\)/g, "").trim();
    return [trimmed, withoutParenthetical];
  });

  return [...new Set(answers.filter(Boolean))];
}

function checkWritingAnswer() {
  if (typingAnswerChecked) return;
  const word = sessionQueue[sessionIndex];
  const expected = document.getElementById("card-back-word").textContent;
  const input    = document.getElementById("writing-input").value;
  const normalizedInput = Speech.normalize(input);
  const correct = getAcceptedAnswers(word).some(answer =>
    Speech.normalize(answer) === normalizedInput
  );

  const fb = document.getElementById("writing-feedback");
  fb.className   = `writing-feedback ${correct ? "correct" : "wrong"}`;
  fb.textContent = correct ? "Правильно!" : `Нет: ${expected}`;

  typingAnswerChecked = true;
  document.getElementById("rating-buttons").classList.remove("hidden");
}

document.getElementById("writing-check-btn").addEventListener("click", checkWritingAnswer);
document.getElementById("writing-input").addEventListener("keydown", e => {
  if (e.key === "Enter") checkWritingAnswer();
});

document.getElementById("writing-hint-btn").addEventListener("click", () => {
  if (typingAnswerChecked) return;
  const word   = sessionQueue[sessionIndex];
  const answer = getAcceptedAnswers(word)[0];
  const hint   = answer.split("").map((ch, i) => (i === 0 ? ch : ch === " " ? " " : "_")).join("");
  const fb = document.getElementById("writing-feedback");
  fb.className   = "writing-feedback hint";
  fb.textContent = hint;
  hintUsed = true;
});

// ── Listening quiz ─────────────────────────────────────────────
function startListeningSession() {
  listeningInEnglish = false;
  document.getElementById("listen-lang-btn").textContent = "🇬🇧 Listen in English";
  const due = getDueCards({ includeNew: false });
  if (due.length === 0) {
    renderNoCardsDue("Пока нечего повторять на слух. Сначала выучите слова в «Карточках» — потом они появятся здесь.");
    return;
  }
  sessionQueue = buildQueue(due).slice(0, 20);
  sessionIndex = 0;
  document.getElementById("listening-quiz-area").classList.remove("hidden");
  renderListeningCard();
}

function renderListeningCard() {
  if (sessionIndex >= sessionQueue.length) {
    renderSessionSummary();
    return;
  }

  const word = sessionQueue[sessionIndex];
  document.getElementById("progress-text").textContent = `${sessionIndex + 1} / ${sessionQueue.length}`;

  const distractors = pickDistractors(word, listeningInEnglish ? "ru" : "en", 3);
  const choices     = buildQueue([word, ...distractors]);

  hideQuizErrorHint(document.getElementById("listening-error-hint"));

  const grid = document.getElementById("mc-grid");
  grid.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className   = "mc-btn";
    btn.textContent = listeningInEnglish ? choice.ru : choice.en;
    btn.dataset.id  = choice.id;
    btn.addEventListener("click", () => handleListeningChoice(choice, word, grid));
    grid.appendChild(btn);
  });

  if (Speech.canSpeak()) {
    listeningInEnglish ? Speech.speakEnglish(word.en) : Speech.speakRussian(word.ru);
  }
}

function handleListeningChoice(choice, word, grid) {
  const btns   = Array.from(grid.querySelectorAll(".mc-btn"));
  const correct = choice.id === word.id;

  btns.forEach(b => {
    b.disabled = true;
    if (b.dataset.id === word.id) b.classList.add("correct");
  });
  if (!correct) btns.find(b => b.dataset.id === choice.id).classList.add("wrong");

  const grade = correct ? 2 : 0;
  recordCardReview(word.id, grade);

  if (!correct) {
    showQuizErrorHint(document.getElementById("listening-error-hint"), word, "Это было:");
  }
  scheduleSessionAdvance(() => { sessionIndex++; renderListeningCard(); }, correct ? 800 : 2600);
}

document.getElementById("replay-btn").addEventListener("click", () => {
  const word = sessionQueue[sessionIndex];
  if (!word || !Speech.canSpeak()) return;
  listeningInEnglish ? Speech.speakEnglish(word.en) : Speech.speakRussian(word.ru);
});

document.getElementById("listen-lang-btn").addEventListener("click", () => {
  listeningInEnglish = !listeningInEnglish;
  document.getElementById("listen-lang-btn").textContent = listeningInEnglish
    ? "🇷🇺 Listen in Russian"
    : "🇬🇧 Listen in English";
  renderListeningCard();
});

// ── Speaking mode ──────────────────────────────────────────────
function startSpeakingSession() {
  const due = getDueCards({ includeNew: false });
  if (due.length === 0) {
    renderNoCardsDue("Пока нечего проговаривать. Сначала выучите слова в «Карточках» — потом они появятся здесь.");
    return;
  }
  sessionQueue = buildQueue(due).slice(0, 20);
  sessionIndex = 0;
  document.getElementById("speaking-area").classList.remove("hidden");
  renderSpeakingCard();
}

function renderSpeakingCard() {
  if (sessionIndex >= sessionQueue.length) {
    renderSessionSummary();
    return;
  }

  const word = sessionQueue[sessionIndex];
  document.getElementById("progress-text").textContent  = `${sessionIndex + 1} / ${sessionQueue.length}`;
  document.getElementById("mic-word-display").textContent = word.en;
  document.getElementById("mic-status").textContent     = "Нажмите микрофон";
  document.getElementById("mic-transcript").textContent = "";
  document.getElementById("mic-btn").classList.remove("mic-btn--listening");
}

document.getElementById("mic-btn").addEventListener("click", startSpeakingAttempt);

function startSpeakingAttempt() {
  const word    = sessionQueue[sessionIndex];
  const micBtn  = document.getElementById("mic-btn");
  const micStat = document.getElementById("mic-status");

  micBtn.classList.add("mic-btn--listening");
  micStat.textContent = "Слушаю...";

  Speech.startRecognition("ru-RU",
    transcript => {
      micBtn.classList.remove("mic-btn--listening");
      document.getElementById("mic-transcript").textContent = `"${transcript}"`;

      const score = Speech.matchScore(transcript, word.ru);
      const grade = score === "exact" ? 3 : score === "partial" ? 2 : 0;
      recordCardReview(word.id, grade);

      micStat.textContent = score === "exact"   ? "Отлично! ✓" :
                            score === "partial"  ? "Почти верно!" :
                                                   `Нет: ${word.ru}`;

      scheduleSessionAdvance(() => { sessionIndex++; renderSpeakingCard(); }, 1200);
    },
    () => {
      micBtn.classList.remove("mic-btn--listening");
      micStat.textContent = "Ошибка. Попробуйте снова.";
    }
  );
}

// ── Speaking EN mode ──────────────────────────────────────────
document.getElementById("start-speaking-en-btn").addEventListener("click", () => {
  speakEnSentenceMode = document.getElementById("speak-en-sentence-toggle").checked;
  speakEnFallback = !Speech.canRecognize();
  if (speakEnFallback) {
    document.getElementById("speak-en-unsupported-msg").style.display = "block";
  }
  startSkillSession("speaking-en");
});

function startSpeakingEnSession() {
  if (speakEnSentenceMode) {
    const due = SENTENCES.filter(s => { const c = Storage.getCard(s.id); return !c || SRS.isDue(c); });
    if (due.length === 0) {
      renderNoCardsDue("Нет предложений к повторению.");
      return;
    }
    sessionQueue = buildQueue(due).slice(0, 10);
  } else {
    const due = getDueCards({ includeNew: false });
    if (due.length === 0) {
      renderNoCardsDue("Пока нечего проговаривать. Сначала выучите слова в «Карточках» — потом они появятся здесь.");
      return;
    }
    sessionQueue = buildQueue(due).slice(0, 20);
  }
  sessionIndex = 0;
  document.getElementById("speaking-en-area").classList.remove("hidden");
  renderSpeakingEnCard();
}

function renderSpeakingEnCard() {
  if (sessionIndex >= sessionQueue.length) {
    renderSessionSummary();
    return;
  }
  const item = sessionQueue[sessionIndex];
  document.getElementById("progress-text").textContent = `${sessionIndex + 1} / ${sessionQueue.length}`;

  const wordDisplay   = document.getElementById("speak-en-word-display");
  const instruction   = document.getElementById("speak-en-instruction");
  const status        = document.getElementById("speak-en-status");
  const transcript    = document.getElementById("speak-en-transcript");
  const feedback      = document.getElementById("speak-en-feedback");
  const expectedEl    = document.getElementById("speak-en-expected");
  const fallbackMsg   = document.getElementById("speak-en-fallback-msg");
  const micBtn        = document.getElementById("mic-btn-en");
  const ratingButtons = document.getElementById("speak-en-rating-buttons");

  wordDisplay.textContent = item.ru;
  instruction.textContent = speakEnSentenceMode ? "Переведи на английский:" : "Скажи по-английски:";
  transcript.textContent  = "";
  feedback.className      = "mic-feedback hidden";
  feedback.textContent    = "";
  micBtn.classList.remove("mic-btn--listening");
  ratingButtons.classList.add("hidden");

  if (speakEnFallback) {
    micBtn.classList.add("hidden");
    status.textContent = "Прочитайте и оцените себя";
    expectedEl.textContent = item.en;
    expectedEl.classList.remove("hidden");
    fallbackMsg.classList.remove("hidden");
    ratingButtons.classList.remove("hidden");
  } else {
    micBtn.classList.remove("hidden");
    status.textContent = "Нажмите микрофон";
    expectedEl.classList.add("hidden");
    fallbackMsg.classList.add("hidden");
  }

  if (Speech.canSpeak()) Speech.speakRussian(item.ru);
}

function stringSimilarity(a, b) {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return 1 - dp[m][n] / maxLen;
}

document.getElementById("mic-btn-en").addEventListener("click", () => {
  if (speakEnFallback) return;
  const item   = sessionQueue[sessionIndex];
  const micBtn = document.getElementById("mic-btn-en");
  const status = document.getElementById("speak-en-status");

  micBtn.classList.add("mic-btn--listening");
  status.textContent = "Слушаю...";

  Speech.startRecognition("en-US",
    transcript => {
      micBtn.classList.remove("mic-btn--listening");
      document.getElementById("speak-en-transcript").textContent = `"${transcript}"`;

      let grade;
      const feedback    = document.getElementById("speak-en-feedback");
      const expectedEl  = document.getElementById("speak-en-expected");

      if (speakEnSentenceMode) {
        const sim = stringSimilarity(Speech.normalize(transcript), Speech.normalize(item.en));
        grade = sim >= 0.85 ? 3 : sim >= 0.70 ? 2 : sim >= 0.40 ? 1 : 0;
        status.textContent = sim >= 0.70 ? "Хорошо! ✓" : `Нет: ${item.en}`;
        feedback.className = `mic-feedback ${sim >= 0.70 ? 'mic-feedback--correct' : 'mic-feedback--wrong'}`;
        feedback.textContent = `Ваш ответ: "${transcript}" | Ожидалось: "${item.en}"`;
      } else {
        const score = Speech.matchScore(transcript, item.en);
        // A recognised-but-wrong answer is graded Again (0), like every other
        // quiz mode — not Hard (1), which would push the card forward and count
        // it toward "mastered" despite the student getting it wrong.
        grade = score === "exact" ? 3 : score === "partial" ? 2 : 0;
        status.textContent = score !== "none" ? "Отлично! ✓" : `Нет: ${item.en}`;
        feedback.className = `mic-feedback ${score !== 'none' ? 'mic-feedback--correct' : 'mic-feedback--wrong'}`;
        feedback.textContent = `Ваш ответ: "${transcript}" | Ожидалось: "${item.en}"`;
      }
      feedback.classList.remove("hidden");

      recordCardReview(item.id, grade);

      scheduleSessionAdvance(() => { sessionIndex++; renderSpeakingEnCard(); }, 2000);
    },
    () => {
      micBtn.classList.remove("mic-btn--listening");
      status.textContent = "Ошибка распознавания. Попробуйте снова.";
      recordCardReview(item.id, 0);
      scheduleSessionAdvance(() => { sessionIndex++; renderSpeakingEnCard(); }, 1500);
    }
  );
});

document.querySelectorAll("#speak-en-rating-buttons .rating-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const grade = parseInt(btn.dataset.enGrade, 10);
    const item  = sessionQueue[sessionIndex];
    if (!item || !recordCardReview(item.id, grade)) return;
    sessionIndex++;
    renderSpeakingEnCard();
  });
});

// ── Reading mode (SRS) ────────────────────────────────────────
function startReadingSession() {
  const due = SENTENCES.filter(s => {
    const card = Storage.getCard(s.id);
    return !card || SRS.isDue(card);
  });
  if (due.length === 0) {
    renderNoCardsDue("Нет предложений к повторению для чтения.");
    return;
  }
  sessionQueue = buildQueue(due).slice(0, 10);
  sessionIndex = 0;
  document.getElementById("reading-area").classList.remove("hidden");
  renderSentence();
}

function renderSentence() {
  if (sessionIndex >= sessionQueue.length) {
    renderReadingComplete();
    return;
  }
  const s = sessionQueue[sessionIndex];
  document.getElementById("sentence-ru").textContent = s.ru;
  document.getElementById("sentence-en").textContent = s.en;
  document.getElementById("sentence-en").classList.add("hidden");
  document.getElementById("reveal-sentence-btn").classList.remove("hidden");
  document.getElementById("sentence-rating").classList.add("hidden");
  document.getElementById("progress-text").textContent = `${sessionIndex + 1} / ${sessionQueue.length}`;

  if (Speech.canSpeak()) Speech.speak(s.ru, "ru-RU");
}

document.getElementById("reveal-sentence-btn").addEventListener("click", () => {
  document.getElementById("sentence-en").classList.remove("hidden");
  document.getElementById("reveal-sentence-btn").classList.add("hidden");
  document.getElementById("sentence-rating").classList.remove("hidden");
});

document.querySelectorAll("#sentence-rating .rating-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const grade = parseInt(btn.dataset.sgrade, 10);
    const s     = sessionQueue[sessionIndex];
    if (!s || !recordCardReview(s.id, grade)) return;
    sessionIndex++;
    renderSentence();
  });
});

function renderReadingComplete() {
  finalizeStudySession();
  hideAllStudySubAreas();
  const area = document.getElementById("session-summary-area");
  area.classList.remove("hidden");
  area.innerHTML = `
    <div class="session-summary card">
      <h2>Чтение завершено!</h2>
      <p>Просмотрено предложений: ${sessionQueue.length}.</p>
      <button class="study-btn summary-home-btn" id="reading-home-btn">На главную</button>
    </div>
  `;
  document.getElementById("reading-home-btn").addEventListener("click", () => showView("home"));
}

// ── Session summary ────────────────────────────────────────────
function formatReturnPhrasing(nextDueMs) {
  if (!nextDueMs) return "Вы полностью догнали программу!";
  const DAY = 86400000;
  const diffDays = Math.ceil((nextDueMs - Date.now()) / DAY);
  if (diffDays <= 0) return "";
  if (diffDays === 1) return "Возвращайтесь завтра!";
  const d = new Date(nextDueMs);
  const days = ["воскресенье", "понедельник", "вторник", "среду", "четверг", "пятницу", "субботу"];
  if (diffDays <= 6) return `Возвращайтесь в ${days[d.getDay()]}`;
  return `Возвращайтесь через ${diffDays} дней`;
}

function renderSessionSummary() {
  finalizeStudySession();
  hideAllStudySubAreas();
  const area  = document.getElementById("session-summary-area");
  const total = getSessionReviewCount();
  const dueCounts = Storage.getDueCountsByDate();

  let nextSessionHtml = "";
  if (dueCounts.tomorrow === 0 && dueCounts.thisWeek === 0) {
    const phrasing = formatReturnPhrasing(dueCounts.nextDueMs);
    nextSessionHtml = `<p class="summary-caught-up">🎉 Вы всё повторили! ${phrasing}</p>`;
  } else {
    const badges = [];
    if (dueCounts.tomorrow > 0) badges.push(`📅 ${dueCounts.tomorrow} завтра`);
    if (dueCounts.thisWeek > 0) badges.push(`📅 ${dueCounts.thisWeek} на неделе`);
    nextSessionHtml = `
      <div class="summary-next-session">
        <div class="summary-next-label">Следующее занятие</div>
        <div class="summary-due-badges">${badges.map(b => `<span class="due-badge">${b}</span>`).join("")}</div>
        <div class="summary-return-hint">${formatReturnPhrasing(dueCounts.nextDueMs)}</div>
      </div>
    `;
  }

  area.classList.remove("hidden");
  area.innerHTML = `
    <div class="session-summary card">
      <h2>Занятие завершено!</h2>
      <p>Повторено карточек: ${total}.</p>
      <div class="summary-grid">
        <div class="stat-box"><div class="value value--again">${sessionStats.again}</div><div class="label">Снова</div></div>
        <div class="stat-box"><div class="value value--hard">${sessionStats.hard}</div><div class="label">Трудно</div></div>
        <div class="stat-box"><div class="value value--good">${sessionStats.good}</div><div class="label">Хорошо</div></div>
        <div class="stat-box"><div class="value value--easy">${sessionStats.easy}</div><div class="label">Легко</div></div>
      </div>
      ${nextSessionHtml}
      <button class="study-btn summary-home-btn" id="summary-home-btn">На главную</button>
    </div>
  `;
  document.getElementById("summary-home-btn").addEventListener("click", () => showView("home"));
}

// ── Back button ────────────────────────────────────────────────
document.getElementById("back-btn").addEventListener("click", () => {
  Speech.cancel();
  finalizeStudySession();
  showView("home");
});

// ── Stats view ────────────────────────────────────────────────
function renderStats() {
  const allCards = Storage.getAllCards();
  const stats    = Storage.getStats();
  const words    = allWords();
  const total    = words.length;
  const learned  = allCards.filter(c => c.repetitions > 0).length;
  const due      = getDueCards().length;
  const mastered = Storage.getMasteredCount();

  document.getElementById("stats-streak").textContent  = stats.streak;
  document.getElementById("stats-learned").textContent = `${learned} / ${total}`;
  document.getElementById("stats-due").textContent     = due;
  document.getElementById("stats-reviews").textContent = stats.totalReviews;

  renderCefrSection(mastered);

  const categories = [...new Set(words.map(w => w.category))];
  const list = document.getElementById("category-list");
  list.innerHTML = "";
  categories.forEach(cat => {
    const catWords   = words.filter(w => w.category === cat);
    const catLearned = catWords.filter(w => {
      const c = Storage.getCard(w.id);
      return c && c.repetitions > 0;
    }).length;
    const pct = Math.round((catLearned / catWords.length) * 100);

    const row = document.createElement("div");
    row.className = "category-row";

    const nameEl = document.createElement("span");
    nameEl.textContent = cat;

    const countEl = document.createElement("span");
    countEl.className = "category-count";
    countEl.textContent = `${catLearned}/${catWords.length}`;

    const barWrap = document.createElement("div");
    barWrap.className = "progress-bar-wrap";
    const barFill = document.createElement("div");
    barFill.className = "progress-bar-fill";
    barFill.style.width = `${pct}%`;
    barWrap.appendChild(barFill);

    row.append(nameEl, countEl, barWrap);
    list.appendChild(row);
  });
}

function renderCefrSection(mastered) {
  const statsView = document.getElementById("view-stats");
  let cefrEl = document.getElementById("cefr-progress-section");
  if (!cefrEl) {
    cefrEl = document.createElement("div");
    cefrEl.id = "cefr-progress-section";
    cefrEl.className = "card cefr-section";
    statsView.insertBefore(cefrEl, document.getElementById("reset-btn"));
  }

  const levels = [
    { name: "A1", min: 0,    max: 500,  label: "Начальный" },
    { name: "A2", min: 501,  max: 1200, label: "Элементарный" },
    { name: "B1", min: 1201, max: 2500, label: "Средний" },
    { name: "B2", min: 2501, max: 5000, label: "Выше среднего" },
    { name: "C1", min: 5001, max: 99999, label: "Продвинутый" },
  ];
  let currentIdx = 0;
  for (let i = 0; i < levels.length; i++) {
    if (mastered >= levels[i].min) currentIdx = i;
    else break;
  }
  const currentLevel = levels[currentIdx];
  const nextLevel = levels[currentIdx + 1];
  const wordsUntilNext = nextLevel ? nextLevel.min - mastered : 0;

  cefrEl.innerHTML = `
    <h3 style="font-size:14px;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:12px">CEFR Прогресс</h3>
    <div class="cefr-mastered-count">
      <span class="cefr-mastered-value">${mastered}</span>
      <span class="cefr-mastered-label">слов освоено (повт. ≥3, лёгкость ≥2.1)</span>
    </div>
    <div class="cefr-ladder">
      ${levels.map((lvl, i) => {
        const isDone    = mastered >= lvl.min;
        const isCurrent = i === currentIdx;
        return `<div class="cefr-step ${isDone ? 'cefr-step--done' : ''} ${isCurrent ? 'cefr-step--current' : ''}">
          <span class="cefr-badge">${lvl.name}</span>
          <span class="cefr-label">${lvl.label} · ${lvl.min}–${lvl.max === 99999 ? '5000+' : lvl.max}</span>
          ${isCurrent ? '<span class="cefr-current-marker">← вы здесь</span>' : ''}
        </div>`;
      }).join("")}
    </div>
    ${nextLevel
      ? `<p class="cefr-next">До уровня <strong>${nextLevel.name}</strong>: ещё <strong>${wordsUntilNext}</strong> слов</p>`
      : `<p class="cefr-next">🏆 Высший уровень достигнут!</p>`}
  `;
}

document.getElementById("reset-btn").addEventListener("click", () => {
  showModal({
    message: "Сбросить весь прогресс? Это нельзя отменить.",
    confirmText: "Сбросить",
    danger: true,
    onConfirm: () => { Storage.resetAll(); renderStats(); renderHome(); },
  });
});

// ── Text quiz mode ─────────────────────────────────────────────
document.getElementById("start-textquiz-btn").addEventListener("click", () => {
  startSkillSession("text-quiz");
});

function startTextQuizSession() {
  const due = getDueCards({ includeNew: false });
  if (due.length === 0) {
    renderNoCardsDue("Пока нечего повторять. Сначала выучите слова в «Карточках» — потом они появятся здесь.");
    return;
  }
  sessionQueue = buildQueue(due).slice(0, 20);
  sessionIndex = 0;
  document.getElementById("text-quiz-area").classList.remove("hidden");
  renderTextQuizCard();
}

function renderTextQuizCard() {
  if (sessionIndex >= sessionQueue.length) {
    renderSessionSummary();
    return;
  }
  const word = sessionQueue[sessionIndex];
  document.getElementById("progress-text").textContent    = `${sessionIndex + 1} / ${sessionQueue.length}`;
  document.getElementById("text-quiz-category").textContent = word.category;
  document.getElementById("text-quiz-word").textContent   = word.ru;

  const distractors = pickDistractors(word, "en", 3);
  const choices     = buildQueue([word, ...distractors]);

  hideQuizErrorHint(document.getElementById("quiz-error-hint"));

  const grid = document.getElementById("text-mc-grid");
  grid.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className   = "mc-btn";
    btn.textContent = choice.en;
    btn.dataset.id  = choice.id;
    btn.addEventListener("click", () => handleTextQuizChoice(choice, word, grid));
    grid.appendChild(btn);
  });
}

function handleTextQuizChoice(choice, word, grid) {
  const btns    = Array.from(grid.querySelectorAll(".mc-btn"));
  const correct = choice.id === word.id;

  btns.forEach(b => {
    b.disabled = true;
    if (b.dataset.id === word.id) b.classList.add("correct");
  });
  if (!correct) btns.find(b => b.dataset.id === choice.id).classList.add("wrong");

  const grade = correct ? 2 : 0;
  recordCardReview(word.id, grade);

  // On a wrong answer, show the explanation and pause longer so the student
  // can read it before the next card.
  if (!correct) {
    showQuizErrorHint(document.getElementById("quiz-error-hint"), word, "Правильный ответ:");
  }
  scheduleSessionAdvance(() => { sessionIndex++; renderTextQuizCard(); }, correct ? 800 : 2600);
}

// ── Category filter ─────────────────────────────────────────────
function populateCategoryFilter() {
  const select = document.getElementById("flashcard-category-select");
  while (select.options.length > 1) select.remove(1);
  const categories = [...new Set(allWords().map(w => w.category))].sort();
  categories.forEach(cat => {
    const opt   = document.createElement("option");
    opt.value   = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
  if (selectedCategory && !categories.includes(selectedCategory)) {
    selectedCategory = "";
    select.value = "";
  }
}

document.getElementById("flashcard-category-select").addEventListener("change", e => {
  selectedCategory = e.target.value;
  renderHome();
});

// ── Daily goal ─────────────────────────────────────────────────
document.getElementById("goal-edit-btn").addEventListener("click", () => {
  const current = Storage.getDailyGoal();
  showModal({
    message: `Цель карточек в день (текущая: ${current})`,
    inputDefault: current,
    onConfirm: (val) => {
      const n = parseInt(val, 10);
      if (n > 0) { Storage.setDailyGoal(n); renderHome(); }
    },
  });
});

document.getElementById("new-per-day-edit-btn").addEventListener("click", () => {
  const current = Storage.getNewPerDay();
  showModal({
    message: `Сколько новых слов добавлять в день? (сейчас: ${current})`,
    inputDefault: current,
    onConfirm: (val) => {
      const n = parseInt(val, 10);
      if (n > 0) { Storage.setNewPerDay(n); renderHome(); }
    },
  });
});

// ── Custom words ────────────────────────────────────────────────
function renderCustomWords() {
  const words = Storage.getCustomWords();
  document.getElementById("custom-words-badge").textContent = words.length;
  const list = document.getElementById("custom-words-list");
  list.innerHTML = "";
  if (words.length === 0) {
    const p = document.createElement("p");
    p.className   = "custom-words-empty";
    p.textContent = "Нет слов. Добавьте свои!";
    list.appendChild(p);
    return;
  }
  words.forEach(w => {
    const row  = document.createElement("div");
    row.className = "custom-word-row";

    const info = document.createElement("span");
    info.className   = "custom-word-info";
    info.textContent = `${w.ru} — ${w.en}`;

    const cat = document.createElement("span");
    cat.className   = "custom-word-cat";
    cat.textContent = w.category;

    const del = document.createElement("button");
    del.className   = "custom-word-del";
    del.textContent = "×";
    del.addEventListener("click", () => {
      Storage.deleteCustomWord(w.id);
      populateCategoryFilter();
      renderHome();
    });

    row.append(info, cat, del);
    list.appendChild(row);
  });
}

document.getElementById("custom-word-form").addEventListener("submit", e => {
  e.preventDefault();
  const ru  = document.getElementById("cw-ru").value.trim();
  const en  = document.getElementById("cw-en").value.trim();
  const cat = document.getElementById("cw-cat").value.trim() || "custom";
  if (!ru || !en) return;
  Storage.addCustomWord(ru, en, cat);
  document.getElementById("cw-ru").value  = "";
  document.getElementById("cw-en").value  = "";
  document.getElementById("cw-cat").value = "";
  populateCategoryFilter();
  renderHome();
});

// ── Grammar module ────────────────────────────────────────────
let grammarCurrentRule = null;
let grammarQuizIndex = 0;
let grammarQuizAnswered = false;
let grammarCorrectCount = 0;

function getGrammarProgress(id) {
  try {
    const raw = localStorage.getItem(`ru_en_grammar_${id}`);
    return raw ? JSON.parse(raw) : { seen: false, quizScore: 0 };
  } catch {
    return { seen: false, quizScore: 0 };
  }
}

function setGrammarProgress(id, data) {
  try {
    localStorage.setItem(`ru_en_grammar_${id}`, JSON.stringify(data));
  } catch {}
}

function showGrammarMode() {
  showView("grammar");
}

function renderGrammarList() {
  document.getElementById("grammar-list-panel").classList.remove("hidden");
  document.getElementById("grammar-detail-panel").classList.add("hidden");
  document.getElementById("grammar-title").textContent = "Грамматика";

  const list = document.getElementById("grammar-cards-list");
  list.innerHTML = "";
  grammarData.forEach(rule => {
    const progress = getGrammarProgress(rule.id);
    const card = document.createElement("div");
    card.className = "grammar-card" + (progress.seen ? " grammar-card--learned" : "");
    card.innerHTML = `
      <div class="grammar-card-header">
        <span class="grammar-card-id">${rule.id}</span>
        ${progress.seen ? '<span class="grammar-learned-badge">✓ Изучено</span>' : ""}
      </div>
      <div class="grammar-card-rule">${rule.rule}</div>
      ${progress.quizScore > 0 ? `<div class="grammar-card-score">Результат теста: ${progress.quizScore}%</div>` : ""}
    `;
    card.addEventListener("click", () => showGrammarDetail(rule.id));
    list.appendChild(card);
  });
}

function showGrammarDetail(id) {
  grammarCurrentRule = grammarData.find(r => r.id === id);
  grammarQuizIndex = 0;
  grammarQuizAnswered = false;
  grammarCorrectCount = 0;

  document.getElementById("grammar-list-panel").classList.add("hidden");
  document.getElementById("grammar-detail-panel").classList.remove("hidden");
  document.getElementById("grammar-title").textContent = grammarCurrentRule.rule;

  document.getElementById("grammar-detail-title").textContent = grammarCurrentRule.rule;
  document.getElementById("grammar-detail-explanation").textContent = grammarCurrentRule.explanation;

  const tbody = document.getElementById("grammar-examples-tbody");
  tbody.innerHTML = "";
  grammarCurrentRule.examples.forEach(ex => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="wrong">${ex.wrong}</td>
      <td class="correct">${ex.right}</td>
      <td class="note">${ex.note}</td>
    `;
    tbody.appendChild(tr);
  });

  const progress = getGrammarProgress(id);
  const markBtn = document.getElementById("grammar-mark-learned-btn");
  markBtn.textContent = progress.seen ? "✓ Изучено" : "Отметить как изученное";
  markBtn.classList.toggle("grammar-mark-learned--done", progress.seen);

  renderGrammarQuiz();
}

function renderGrammarQuiz() {
  const rule = grammarCurrentRule;
  const quizArea = document.getElementById("grammar-quiz-area");

  if (grammarQuizIndex >= rule.quiz.length) {
    const score = Math.round((grammarCorrectCount / rule.quiz.length) * 100);
    const progress = getGrammarProgress(rule.id);
    if (score > progress.quizScore) {
      progress.quizScore = score;
      setGrammarProgress(rule.id, progress);
    }
    quizArea.innerHTML = `
      <p class="grammar-quiz-done">Тест пройден! Результат: ${score}%</p>
      <button class="btn-secondary grammar-quiz-restart-btn" id="grammar-quiz-restart">Пройти снова</button>
    `;
    document.getElementById("grammar-quiz-restart").addEventListener("click", () => {
      grammarQuizIndex = 0;
      grammarCorrectCount = 0;
      renderGrammarQuiz();
    });
    return;
  }

  const q = rule.quiz[grammarQuizIndex];
  grammarQuizAnswered = false;

  quizArea.innerHTML = `
    <p class="grammar-quiz-question">${q.question}</p>
    <div class="grammar-quiz-options" id="grammar-quiz-options"></div>
    <div class="grammar-quiz-feedback hidden" id="grammar-quiz-feedback"></div>
    <button class="skill-start-btn grammar-quiz-next hidden" id="grammar-quiz-next">
      ${grammarQuizIndex + 1 < rule.quiz.length ? "Следующий вопрос →" : "Завершить тест"}
    </button>
    <p class="grammar-quiz-progress">${grammarQuizIndex + 1} / ${rule.quiz.length}</p>
  `;

  const optionsDiv = document.getElementById("grammar-quiz-options");
  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "grammar-quiz-option";
    btn.textContent = opt;
    btn.addEventListener("click", () => handleGrammarQuizAnswer(idx, q.answer));
    optionsDiv.appendChild(btn);
  });
}

function handleGrammarQuizAnswer(chosen, correct) {
  if (grammarQuizAnswered) return;
  grammarQuizAnswered = true;
  // Grammar progress is tracked separately (seen / quizScore via setGrammarProgress).
  // Count the answer toward the daily streak/review total, but do NOT call
  // Storage.updateCard here: a grammar rule id is not a vocabulary id, so it would
  // create an SRS card that getAllCards filters out — a write nothing ever reads.
  Storage.recordStudySession(1);

  const options = document.querySelectorAll(".grammar-quiz-option");
  options.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === correct) btn.classList.add("grammar-quiz-option--correct");
    else if (idx === chosen) btn.classList.add("grammar-quiz-option--wrong");
  });

  const feedback = document.getElementById("grammar-quiz-feedback");
  if (chosen === correct) {
    grammarCorrectCount++;
    feedback.textContent = "Правильно! ✓";
    feedback.className = "grammar-quiz-feedback grammar-quiz-feedback--correct";
  } else {
    const correctText = grammarCurrentRule.quiz[grammarQuizIndex].options[correct];
    feedback.textContent = `Неверно. Правильный ответ: «${correctText}»`;
    feedback.className = "grammar-quiz-feedback grammar-quiz-feedback--wrong";
  }
  feedback.classList.remove("hidden");

  const nextBtn = document.getElementById("grammar-quiz-next");
  nextBtn.classList.remove("hidden");
  nextBtn.addEventListener("click", () => {
    nextBtn.disabled = true;
    grammarQuizIndex++;
    renderGrammarQuiz();
  });
}

document.getElementById("start-grammar-btn").addEventListener("click", showGrammarMode);

document.getElementById("grammar-back-btn").addEventListener("click", () => {
  const detailPanel = document.getElementById("grammar-detail-panel");
  if (!detailPanel.classList.contains("hidden")) {
    renderGrammarList();
  } else {
    showView("home");
  }
});

document.getElementById("grammar-mark-learned-btn").addEventListener("click", () => {
  const id = grammarCurrentRule.id;
  const progress = getGrammarProgress(id);
  progress.seen = !progress.seen;
  setGrammarProgress(id, progress);
  const btn = document.getElementById("grammar-mark-learned-btn");
  btn.textContent = progress.seen ? "✓ Изучено" : "Отметить как изученное";
  btn.classList.toggle("grammar-mark-learned--done", progress.seen);
});

// ── Modal (replaces confirm/prompt: blocked in Android WebView) ───────────
function showModal({ message, inputDefault, inputType, confirmText, danger, onConfirm, onCancel }) {
  const overlay    = document.getElementById("app-modal-overlay");
  const msgEl      = document.getElementById("modal-message");
  const inputEl    = document.getElementById("modal-input");
  const confirmBtn = document.getElementById("modal-confirm-btn");
  const cancelBtn  = document.getElementById("modal-cancel-btn");

  msgEl.textContent      = message;
  confirmBtn.textContent = confirmText || "ОК";
  confirmBtn.classList.toggle("modal-confirm-btn--danger", Boolean(danger));

  const hasInput = inputDefault !== undefined;
  // Default to a number spinner (used by the goal editors); passphrase prompts
  // pass inputType "password".
  inputEl.type = inputType || "number";
  inputEl.classList.toggle("hidden", !hasInput);
  if (hasInput) {
    inputEl.value = inputDefault;
    setTimeout(() => { inputEl.focus(); inputEl.select(); }, 50);
  }

  overlay.classList.remove("hidden");

  function close() {
    overlay.classList.add("hidden");
    confirmBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onNo);
    overlay.removeEventListener("click", onBg);
    inputEl.removeEventListener("keydown", onKey);
  }
  function onOk()  { close(); if (onConfirm) onConfirm(hasInput ? inputEl.value : undefined); }
  function onNo()  { close(); if (onCancel) onCancel(); }
  function onBg(e) { if (e.target === overlay) onNo(); }
  function onKey(e) { if (e.key === "Enter") onOk(); if (e.key === "Escape") onNo(); }

  confirmBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onNo);
  overlay.addEventListener("click", onBg);
  inputEl.addEventListener("keydown", onKey);
}

// ── Boot ─────────────────────────────────────────────────────
showView("home");
populateCategoryFilter();
