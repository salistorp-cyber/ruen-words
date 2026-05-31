// First-time onboarding wizard for complete beginners.
// Shown once on first visit; introduces the app, the key English-vs-Russian
// pitfalls, the recommended learning path, and the strict AI tutor approach.
// Written in Russian, since the learner's known language is Russian.

const Onboarding = (() => {
  const KEY = "ru_en_trainer_onboarded";

  // Things in English that trip up Russian speakers and cannot be skipped.
  // Mirrors the Mandarin app's "tones" slide, adapted to English.
  const PITFALL_DATA = [
    {
      mark: "a / the", color: "#e53e3e", label: "Артикли",
      desc: "В русском их нет, в английском они обязательны. \"a\" — для нового предмета, \"the\" — для уже известного.",
      ex: "I have a cat. The cat is black."
    },
    {
      mark: "S-V-O", color: "#dd6b20", label: "Порядок слов",
      desc: "В английском он строгий: подлежащее → сказуемое → дополнение. Переставлять слова, как в русском, нельзя.",
      ex: "I love coffee. (не Love I coffee)"
    },
    {
      mark: "do?", color: "#38a169", label: "Вопросы",
      desc: "Вопросы в настоящем времени строятся со вспомогательным do / does, а не просто интонацией.",
      ex: "Do you speak English?"
    },
    {
      mark: "th / w", color: "#3182ce", label: "Звуки",
      desc: "Некоторых звуков в русском нет: \"th\" (think), различие \"w\"/\"v\" (wine/vine), короткое \"i\" (ship/sheep).",
      ex: "think · wine · ship"
    }
  ];

  let step = 0;
  const TOTAL = 4;

  function byId(id) { return document.getElementById(id); }

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderStep() {
    const body = byId("onboarding-body");
    if (!body) return;

    byId("onboarding-modal").querySelectorAll(".ob-dot").forEach((d, i) => {
      d.classList.toggle("active", i === step);
    });

    const templates = [
      // Step 0 — Welcome
      `<h2 class="ob-title">Добро пожаловать!</h2>
       <p class="ob-p">Это приложение учит английскому с нуля: карточки с интервальным повторением, аудирование, разговорная практика, грамматика и уроки с AI.</p>
       <p class="ob-p">В отличие от большинства приложений, AI-тренер здесь <strong>не создан, чтобы вам было приятно</strong>. Он назовёт каждую вашу ошибку, попросит повторить правильно и объяснит, какое правило вы нарушили. Именно так и происходит настоящее обучение.</p>
       <p class="ob-p">Это введение займёт около 2 минут и покажет то, что пропускать нельзя.</p>`,

      // Step 1 — Key pitfalls
      `<h2 class="ob-title">Главное, что отличает английский</h2>
       <p class="ob-p">В английском есть вещи, которых нет в русском. Их нельзя игнорировать — на них строятся почти все фразы.</p>
       <div class="ob-tone-guide">
         ${PITFALL_DATA.map(t => `
           <div class="ob-tone-item" style="border-left:4px solid ${t.color}">
             <div class="ob-tone-mark" style="color:${t.color}">${esc(t.mark)}</div>
             <div class="ob-tone-body">
               <strong>${esc(t.label)}</strong>
               <div class="ob-tone-desc">${esc(t.desc)}</div>
               <div class="ob-tone-ex">${esc(t.ex)}</div>
             </div>
           </div>`).join("")}
       </div>`,

      // Step 2 — Learning path
      `<h2 class="ob-title">С чего начать</h2>
       <p class="ob-p">Следуйте этому порядку. Не перепрыгивайте — каждый режим опирается на предыдущий.</p>
       <ol class="ob-path">
         <li><strong>Грамматика</strong> — прочитайте первые 2–3 правила (порядок слов, артикли, вопросы)</li>
         <li><strong>Карточки</strong> — начните с темы «Приветствия» в режиме RU→EN</li>
         <li><strong>Выбор ответа</strong> — закрепляйте узнавание слов вариантами на выбор</li>
         <li><strong>Слушать</strong> — когда выучите ~10 слов, тренируйте восприятие на слух</li>
         <li><strong>AI Урок</strong> — поговорите с настоящим строгим тренером (следующий шаг)</li>
       </ol>
       <p class="ob-p">Приложение запоминает, что вы путаете, и само возвращает это к повторению — доверьтесь системе.</p>`,

      // Step 3 — AI tutor
      `<h2 class="ob-title">AI-тренер — чего ожидать</h2>
       <p class="ob-p">Вкладка «AI Урок» создаёт промпт, который вы вставляете в Claude или ChatGPT. Используйте режим <strong>«Тренер для начинающих»</strong> — он велит AI:</p>
       <ul class="ob-list">
         <li>Называть каждую ошибку: не то слово, не тот порядок, не тот артикль</li>
         <li>Требовать повторить правильную форму, прежде чем идти дальше</li>
         <li>Объяснять правило за каждым исправлением, а не просто давать ответ</li>
         <li>Объяснять по-русски, пока вы новичок, и проверять понимание</li>
       </ul>
       <p class="ob-p">Без пустой похвалы. Прямые исправления. Если становится некомфортно — этот дискомфорт и есть сигнал, что вы учитесь.</p>
       <p class="ob-p">Вы новичок, поэтому начнём <strong>сразу с первого урока</strong> — мы откроем AI и вставим готовый промпт для начинающих. После урока вставьте конспект обратно, чтобы AI запоминал ваш прогресс.</p>`
    ];

    body.innerHTML = templates[step] || "";

    const prevBtn = byId("onboarding-prev");
    const nextBtn = byId("onboarding-next");
    if (prevBtn) prevBtn.hidden = step === 0;
    if (nextBtn) nextBtn.textContent = step === TOTAL - 1 ? "Начать первый урок" : "Далее →";
  }

  function next() {
    if (step < TOTAL - 1) { step++; renderStep(); }
    else { dismiss(); startFirstLesson(); }
  }

  // Launch the one-tap AI first lesson right after onboarding. Guarded so the
  // wizard still closes cleanly if the AI module failed to load for any reason.
  function startFirstLesson() {
    try {
      if (typeof AILesson !== "undefined" && AILesson.startFirstLesson) {
        AILesson.startFirstLesson();
      }
    } catch {}
  }

  function prev() {
    if (step > 0) { step--; renderStep(); }
  }

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch {}
    const modal = byId("onboarding-modal");
    if (modal) modal.hidden = true;
  }

  function show() {
    step = 0;
    renderStep();
    const modal = byId("onboarding-modal");
    if (modal) modal.hidden = false;
  }

  function init() {
    const modal = byId("onboarding-modal");
    if (!modal) return;

    let seen = false;
    try { seen = !!localStorage.getItem(KEY); } catch {}
    if (seen) return;

    show();

    byId("onboarding-next").addEventListener("click", next);
    byId("onboarding-prev").addEventListener("click", prev);
    byId("onboarding-skip").addEventListener("click", dismiss);
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return { init, show };
})();

if (typeof module !== "undefined" && module.exports) module.exports = Onboarding;
if (typeof globalThis !== "undefined") globalThis.Onboarding = Onboarding;
