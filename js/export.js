const ExportManager = (() => {
  const VERSION = 3;
  // v2 backups predate the AI knowledge base; still accepted on import (their
  // missing `kb` is treated as "leave existing AI history untouched").
  const SUPPORTED_VERSIONS = [2, 3];
  const MAX_BYTES = 512 * 1024;
  const CARD_PREFIX = "ru_en_trainer_srs_";
  const LEGACY_CARD_PREFIX = "srs_";
  const STATS_KEY = "ru_en_trainer_stats";
  const LEGACY_STATS_KEY = "srs_stats";
  const CUSTOM_WORDS_KEY = "ru_en_custom_words";
  const GRAMMAR_PREFIX = "ru_en_grammar_";
  const GOAL_KEY = "ru_en_goal";
  const KB_KEY = "ru_en_kb";
  const MIN_REVIEW_MS = Date.UTC(2020, 0, 1);
  const TEN_YEARS_MS = 10 * 365.25 * 86400000;

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function hasOnlyKeys(value, keys) {
    return Object.keys(value).every(key => keys.includes(key));
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function isNonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isSafeObjectKey(key) {
    return key !== "__proto__" && key !== "prototype" && key !== "constructor";
  }

  function makePayload() {
    const cards = {};
    (Storage.getAllCardStates ? Storage.getAllCardStates() : Storage.getAllCards()).forEach(card => {
      if (card && typeof card.id === "string" && isSafeObjectKey(card.id)) {
        cards[card.id] = clone(card);
      }
    });

    return {
      version: VERSION,
      exportedAt: new Date(Date.now()).toISOString(),
      cards,
      stats: clone(Storage.getStats()),
      customWords: clone(Storage.getCustomWords()),
      grammarProgress: clone(Storage.getAllGrammarProgress ? Storage.getAllGrammarProgress() : {}),
      dailyGoal: Storage.getDailyGoal(),
      // The AI learning history (lessons, vocabulary, weak points, profile). This
      // is what makes the backup portable across phones — without it, swapping
      // devices loses the entire AI-lesson history.
      kb: typeof KnowledgeBase !== "undefined" ? clone(KnowledgeBase.load()) : {},
    };
  }

  function backupFilename(ext) {
    const date = new Date(Date.now()).toISOString().slice(0, 10);
    return `ru_en_progress_${date}.${ext || "json"}`;
  }

  function payloadJSON(payload) {
    return JSON.stringify(payload, null, 2);
  }

  function downloadJSON(payload) {
    if (typeof document === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") return;

    const blob = new Blob([payloadJSON(payload)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFilename("json");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadText(text, filename, mime) {
    if (typeof document === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") return;
    const blob = new Blob([text], { type: mime || "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function buildBackupFile(payload) {
    if (typeof File === "undefined") return null;
    try {
      // Use text/plain + .txt: application/json is NOT in the Web Share API's
      // shareable file-type list, so navigator.canShare({files}) rejects it on
      // iOS Safari / Android Chrome and the share button would never appear.
      // The contents are still JSON; import reads file text and accepts .txt too.
      return new File([payloadJSON(payload)], backupFilename("txt"), { type: "text/plain" });
    } catch {
      return null;
    }
  }

  function canShareProgress() {
    if (typeof navigator === "undefined" || typeof navigator.share !== "function") return false;
    if (typeof navigator.canShare !== "function") return false;
    const file = buildBackupFile(makePayload());
    if (!file) return false;
    try { return navigator.canShare({ files: [file] }); } catch { return false; }
  }

  function exportProgress() {
    const payload = makePayload();
    downloadJSON(payload);
    return { ok: true, data: payload };
  }

  // Encrypted backup: the same payload, AES-GCM-encrypted under a user passphrase,
  // downloaded as a .enc file. This is the "very secure" portable copy the learner
  // moves between phones; nothing is recoverable without the passphrase.
  async function exportEncryptedProgress(passphrase) {
    if (typeof CryptoBackup === "undefined" || !CryptoBackup.available()) {
      return { ok: false, error: "crypto_unavailable" };
    }
    const payload = makePayload();
    let envelope;
    try {
      envelope = await CryptoBackup.encrypt(payloadJSON(payload), passphrase);
    } catch {
      return { ok: false, error: "encrypt_failed" };
    }
    downloadText(envelope, backupFilename("enc"), "text/plain");
    return { ok: true, data: payload };
  }

  async function shareProgress() {
    const payload = makePayload();
    const file = buildBackupFile(payload);
    if (file && typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ files: [file], title: "Прогресс RuEn Words" });
        return { ok: true, shared: true, data: payload };
      } catch (err) {
        if (err && err.name === "AbortError") return { ok: true, shared: false, cancelled: true, data: payload };
        // Sharing failed at runtime — fall back to a download below.
      }
    }
    downloadJSON(payload);
    return { ok: true, shared: false, data: payload };
  }

  function validateCard(card, id, now) {
    if (!isPlainObject(card)) return `cards.${id} must be an object`;
    if (!hasOnlyKeys(card, ["id", "interval", "repetitions", "easeFactor", "nextReview"])) {
      return `cards.${id} has invalid fields`;
    }
    if (typeof card.id !== "string" || card.id.trim() === "" || card.id !== id || !isSafeObjectKey(id)) {
      return `cards.${id}.id is invalid`;
    }
    if (!isFiniteNumber(card.interval) || !Number.isInteger(card.interval) || card.interval < 0) {
      return `cards.${id}.interval is invalid`;
    }
    if (!isFiniteNumber(card.repetitions) || !Number.isInteger(card.repetitions) || card.repetitions < 0) {
      return `cards.${id}.repetitions is invalid`;
    }
    if (!isFiniteNumber(card.easeFactor) || card.easeFactor < 1.0 || card.easeFactor > 5.0) {
      return `cards.${id}.easeFactor is invalid`;
    }
    if (!isFiniteNumber(card.nextReview) || !Number.isInteger(card.nextReview)) {
      return `cards.${id}.nextReview is invalid`;
    }
    if (card.nextReview < MIN_REVIEW_MS || card.nextReview > now + TEN_YEARS_MS) {
      return `cards.${id}.nextReview is out of range`;
    }
    return null;
  }

  function validateStats(stats) {
    if (!isPlainObject(stats)) return "stats must be an object";
    // newToday / lastNewDate track the daily new-word cap (storage.recordNewIntroduced).
    // They live inside stats, so a backup taken after studying any new word includes
    // them — leaving them out of this allowlist made the app reject its own export.
    if (!hasOnlyKeys(stats, ["streak", "lastStudyDate", "totalReviews", "todayReviews", "newToday", "lastNewDate"])) {
      return "stats has invalid fields";
    }
    if (!isNonNegativeInteger(stats.streak)) return "stats.streak is invalid";
    if (!isNonNegativeInteger(stats.totalReviews)) return "stats.totalReviews is invalid";
    if (stats.todayReviews !== undefined && !isNonNegativeInteger(stats.todayReviews)) {
      return "stats.todayReviews is invalid";
    }
    if (stats.newToday !== undefined && !isNonNegativeInteger(stats.newToday)) {
      return "stats.newToday is invalid";
    }
    if (stats.lastStudyDate !== null && typeof stats.lastStudyDate !== "string") {
      return "stats.lastStudyDate is invalid";
    }
    if (stats.lastNewDate !== undefined && stats.lastNewDate !== null && typeof stats.lastNewDate !== "string") {
      return "stats.lastNewDate is invalid";
    }
    return null;
  }

  function validateCustomWord(word, index) {
    if (!isPlainObject(word)) return `customWords[${index}] must be an object`;
    if (!hasOnlyKeys(word, ["id", "ru", "en", "translit", "category"])) {
      return `customWords[${index}] has invalid fields`;
    }
    if (typeof word.id !== "string" || word.id.trim() === "") return `customWords[${index}].id is invalid`;
    if (typeof word.ru !== "string" || word.ru.trim() === "") return `customWords[${index}].ru is invalid`;
    if (typeof word.en !== "string" || word.en.trim() === "") return `customWords[${index}].en is invalid`;
    if (typeof word.translit !== "string") return `customWords[${index}].translit is invalid`;
    if (typeof word.category !== "string" || word.category.trim() === "") {
      return `customWords[${index}].category is invalid`;
    }
    return null;
  }

  function validateGrammarProgress(progress) {
    if (!isPlainObject(progress)) return "grammarProgress must be an object";
    for (const id of Object.keys(progress)) {
      const item = progress[id];
      if (typeof id !== "string" || id.trim() === "") return "grammarProgress id is invalid";
      if (!isPlainObject(item)) return `grammarProgress.${id} must be an object`;
      if (!hasOnlyKeys(item, ["seen", "quizScore"])) return `grammarProgress.${id} has invalid fields`;
      if (typeof item.seen !== "boolean") return `grammarProgress.${id}.seen is invalid`;
      if (!isNonNegativeInteger(item.quizScore) || item.quizScore > 100) {
        return `grammarProgress.${id}.quizScore is invalid`;
      }
    }
    return null;
  }

  function validatePayload(payload) {
    if (!isPlainObject(payload)) return { ok: false, error: "Import file root must be an object." };
    if (!Object.prototype.hasOwnProperty.call(payload, "version")) {
      return { ok: false, error: "Import file is missing version." };
    }
    if (!SUPPORTED_VERSIONS.includes(payload.version)) return { ok: false, error: "Unsupported import version." };
    if (!hasOnlyKeys(payload, ["version", "exportedAt", "cards", "stats", "customWords", "grammarProgress", "dailyGoal", "kb"])) {
      return { ok: false, error: "Import file has invalid fields." };
    }
    // kb is optional (absent in v2 backups). If present it must be an object;
    // KnowledgeBase.validate() sanitizes the contents on write, so we only guard
    // the shape here.
    if (Object.prototype.hasOwnProperty.call(payload, "kb") && !isPlainObject(payload.kb)) {
      return { ok: false, error: "kb must be an object." };
    }
    if (
      typeof payload.exportedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(payload.exportedAt) ||
      Number.isNaN(Date.parse(payload.exportedAt))
    ) {
      return { ok: false, error: "exportedAt is invalid." };
    }
    if (!isPlainObject(payload.cards)) return { ok: false, error: "cards must be an object." };
    if (!Array.isArray(payload.customWords)) return { ok: false, error: "customWords must be an array." };
    if (!isNonNegativeInteger(payload.dailyGoal) || payload.dailyGoal < 1) {
      return { ok: false, error: "dailyGoal is invalid." };
    }

    const now = Date.now();
    for (const id of Object.keys(payload.cards)) {
      if (!isSafeObjectKey(id)) return { ok: false, error: "cards contains unsafe id." };
      const error = validateCard(payload.cards[id], id, now);
      if (error) return { ok: false, error };
    }

    const statsError = validateStats(payload.stats);
    if (statsError) return { ok: false, error: statsError };

    for (let i = 0; i < payload.customWords.length; i++) {
      const error = validateCustomWord(payload.customWords[i], i);
      if (error) return { ok: false, error };
    }

    const grammarError = validateGrammarProgress(payload.grammarProgress);
    if (grammarError) return { ok: false, error: grammarError };

    return { ok: true };
  }

  function managedKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith(CARD_PREFIX) ||
        key.startsWith(LEGACY_CARD_PREFIX) ||
        key.startsWith(GRAMMAR_PREFIX) ||
        key === STATS_KEY ||
        key === LEGACY_STATS_KEY ||
        key === CUSTOM_WORDS_KEY ||
        key === GOAL_KEY
      ) {
        keys.push(key);
      }
    }
    return keys;
  }

  function writePayload(payload) {
    managedKeys().forEach(key => localStorage.removeItem(key));
    Object.keys(payload.cards).forEach(id => {
      const card = payload.cards[id];
      localStorage.setItem(CARD_PREFIX + card.id, JSON.stringify(card));
    });
    localStorage.setItem(STATS_KEY, JSON.stringify(payload.stats));
    localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(payload.customWords));
    Object.keys(payload.grammarProgress).forEach(id => {
      if (!isSafeObjectKey(id)) return;
      localStorage.setItem(GRAMMAR_PREFIX + id, JSON.stringify(payload.grammarProgress[id]));
    });
    localStorage.setItem(GOAL_KEY, String(payload.dailyGoal));
    // Restore the AI history only when the backup carries it. A v2 backup (no kb)
    // leaves the device's existing AI history untouched rather than wiping it.
    if (Object.prototype.hasOwnProperty.call(payload, "kb")) {
      if (typeof KnowledgeBase !== "undefined" && KnowledgeBase.replaceAll) {
        KnowledgeBase.replaceAll(payload.kb);
      } else {
        localStorage.setItem(KB_KEY, JSON.stringify(payload.kb));
      }
    }
  }

  function readFileText(file) {
    if (file && typeof file.text === "function") return file.text();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsText(file);
    });
  }

  async function importProgress(file, passphrase) {
    if (!file) return { ok: false, error: "No file selected." };
    if (typeof file.size === "number" && file.size > MAX_BYTES) {
      return { ok: false, error: "Import file is larger than 512 KB." };
    }

    let text;
    try {
      text = await readFileText(file);
    } catch {
      return { ok: false, error: "Could not read file." };
    }

    // Encrypted backups need the passphrase. If none was supplied, signal the UI
    // to prompt for one and re-call; a wrong passphrase fails the GCM auth tag.
    if (typeof CryptoBackup !== "undefined" && CryptoBackup.isEnvelope(text)) {
      if (!passphrase) return { ok: false, error: "PASSPHRASE_REQUIRED", encrypted: true };
      try {
        text = await CryptoBackup.decrypt(text, passphrase);
      } catch (err) {
        const msg = err && err.message === "crypto_unavailable"
          ? "Шифрование недоступно в этом браузере."
          : "Неверный пароль или повреждённый файл.";
        return { ok: false, error: msg };
      }
    }

    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, error: "Import file is not valid JSON." };
    }

    const validation = validatePayload(payload);
    if (!validation.ok) return validation;

    try {
      writePayload(payload);
    } catch {
      return { ok: false, error: "Could not save imported progress." };
    }

    return { ok: true };
  }

  function setMessage(message, isError) {
    const el = document.getElementById("export-import-message");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("value--again", Boolean(isError));
    el.classList.toggle("value--good", !isError && message !== "");
  }

  function refreshViews() {
    if (typeof renderStats === "function") renderStats();
    if (typeof renderHome === "function") renderHome();
    if (typeof populateCategoryFilter === "function") populateCategoryFilter();
  }

  function promptForPassphrase(message, onConfirm) {
    if (typeof showModal !== "function") return;
    showModal({
      message,
      inputType: "password",
      inputDefault: "",
      confirmText: "ОК",
      onConfirm: (val) => onConfirm(String(val || "")),
    });
  }

  function wireUI() {
    if (typeof document === "undefined") return;
    const exportBtn = document.getElementById("export-progress-btn");
    const exportEncBtn = document.getElementById("export-encrypted-btn");
    const importBtn = document.getElementById("import-progress-btn");
    const shareBtn = document.getElementById("share-progress-btn");
    const input = document.getElementById("import-progress-file");
    if (!exportBtn || !importBtn || !input) return;

    if (exportEncBtn) {
      if (typeof CryptoBackup === "undefined" || !CryptoBackup.available()) {
        exportEncBtn.hidden = true;
      } else {
        exportEncBtn.addEventListener("click", () => {
          promptForPassphrase(
            "Придумайте пароль для зашифрованной копии. Запомните его — без пароля файл нельзя восстановить.",
            (p1) => {
              if (p1.length < 6) { setMessage("Пароль слишком короткий (минимум 6 символов).", true); return; }
              promptForPassphrase("Повторите пароль.", async (p2) => {
                if (p1 !== p2) { setMessage("Пароли не совпадают.", true); return; }
                const result = await exportEncryptedProgress(p1);
                setMessage(result.ok ? "Зашифрованная копия сохранена." : "Не удалось зашифровать копию.", !result.ok);
              });
            }
          );
        });
      }
    }

    if (shareBtn && canShareProgress()) {
      shareBtn.hidden = false;
      shareBtn.addEventListener("click", async () => {
        setMessage("Открываем меню «Поделиться»...", false);
        const result = await shareProgress();
        if (result.cancelled) {
          setMessage("", false);
        } else if (result.shared) {
          setMessage("Прогресс отправлен.", false);
        } else {
          setMessage("Прогресс сохранён в файл.", false);
        }
      });
    }

    exportBtn.addEventListener("click", () => {
      const result = exportProgress();
      if (result.ok) setMessage("Прогресс экспортирован.", false);
    });

    importBtn.addEventListener("click", () => {
      input.click();
    });

    function finishImport(result) {
      if (!result.ok) {
        setMessage(`Ошибка импорта: ${result.error}`, true);
        return;
      }
      refreshViews();
      setMessage("Прогресс импортирован.", false);
    }

    input.addEventListener("change", async () => {
      const file = input.files && input.files[0];
      input.value = "";
      if (!file) return;
      setMessage("Импортируем прогресс...", false);
      const result = await importProgress(file);
      if (!result.ok && result.encrypted) {
        promptForPassphrase("Введите пароль зашифрованной копии.", async (p) => {
          setMessage("Расшифровываем...", false);
          finishImport(await importProgress(file, p));
        });
        return;
      }
      finishImport(result);
    });
  }

  if (typeof document !== "undefined") wireUI();

  return { exportProgress, exportEncryptedProgress, shareProgress, importProgress };
})();
