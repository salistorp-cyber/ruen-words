const Speech = (() => {
  let activeRecognition = null;
  let stopActiveRecognition = null;

  function canSpeak() {
    return "speechSynthesis" in window;
  }

  function canRecognize() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function speak(text, lang) {
    if (!canSpeak()) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang || "ru-RU";
    speechSynthesis.speak(utter);
  }

  function startRecognition(lang, onResult, onError) {
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) { onError("unsupported"); return; }

    if (stopActiveRecognition) stopActiveRecognition();

    const rec = new Rec();
    activeRecognition = rec;
    let settled = false;
    let timeoutId = null;

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (activeRecognition === rec) activeRecognition = null;
      if (stopActiveRecognition === cancelCurrent) stopActiveRecognition = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.onend = null;
    };

    const settle = callback => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const cancelCurrent = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try { rec.abort(); } catch {}
    };

    stopActiveRecognition = cancelCurrent;

    rec.lang = lang || "ru-RU";
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript;
      settle(() => onResult(transcript));
    };
    rec.onerror = e => settle(() => onError(e.error || "recognition-error"));
    rec.onend = () => settle(() => onError("no-speech"));
    timeoutId = setTimeout(() => {
      try { rec.abort(); } catch {}
      settle(() => onResult(""));
    }, 8000);

    try {
      rec.start();
    } catch {
      settle(() => onError("start-failed"));
    }
  }

  function normalize(text) {
    return text.toLowerCase().replace(/[^а-яёa-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  }

  function cancel() {
    if (canSpeak()) speechSynthesis.cancel();
    if (stopActiveRecognition) stopActiveRecognition();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function matchScore(spoken, expected) {
    const s = normalize(spoken);
    const e = normalize(expected);
    if (s === e) return "exact";
    const threshold = e.length <= 8 ? 1 : 2;
    if (e.includes(s) || s.includes(e) || levenshtein(s, e) <= threshold) return "partial";
    return "none";
  }

  function speakRussian(text) { speak(text, "ru-RU"); }
  function speakEnglish(text) { speak(text, "en-US"); }

  return { canSpeak, canRecognize, speak, speakRussian, speakEnglish, cancel, startRecognition, normalize, matchScore };
})();
