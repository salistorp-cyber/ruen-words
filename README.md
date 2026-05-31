# Russian ↔ English Vocabulary Trainer

A browser-based spaced-repetition app for Russian speakers learning English. No
install, no server, no account required. Delivered as a Progressive Web App
(works offline, installable from the browser).

## How to run

Open `index.html` in any browser. That's it.

```
projects/russianenglish learning/index.html
```

Works offline (service worker). Progress is saved automatically in your
browser's `localStorage`.

## Features

- **500+ curated words** across many beginner-friendly categories (greetings,
  numbers, family, food, phrases, colors, days, time, places, verbs, adjectives,
  body, clothing, transport, weather, emotions, home, nature, work, health,
  education, shopping, travel, …).
- **SM-2 spaced repetition** — the same scheduling algorithm as Anki.
- **Beginner pacing** — only a few brand-new words are introduced per day
  (default 10, adjustable on the home screen) so you're never flooded. New words
  appear in a beginner-friendly category order.
- **Study modes**: flashcards (RU→EN / EN→RU / Mixed, optional typing), listening
  quiz, speaking practice (Web Speech API), text multiple-choice quiz, and
  sentence reading.
- **Grammar module** — rules with right/wrong examples and a per-rule quiz.
- **AI lesson mode (no API)** — generates a tutor prompt you paste into Claude or
  ChatGPT, then imports the lesson summary back into a local knowledge base; can
  turn lesson vocabulary into SRS flashcards.
- **Progress export / import / share** as a JSON backup file — **including the AI
  lesson history** — with an optional **passphrase-encrypted backup** (AES-GCM via
  WebCrypto) for securely moving everything between phones (Samsung ↔ iPhone).
- **Streak tracking**, per-category progress, and a CEFR progress ladder.
- **Fully offline** — no backend.

## File structure

```
├── index.html          — app shell
├── css/style.css       — all styles
├── js/
│   ├── data.js         — vocabulary entries
│   ├── sentences.js    — reading/sentence data
│   ├── grammar.js      — grammar rules + quizzes
│   ├── srs.js          — SM-2 algorithm
│   ├── storage.js      — localStorage helpers
│   ├── export.js       — progress export / import / share
│   ├── kb.js           — AI-lesson knowledge base
│   ├── ai_lesson.js    — AI tutor prompt + summary import
│   ├── speech.js       — Web Speech (TTS + recognition)
│   ├── onboarding.js   — first-run wizard
│   └── app.js          — view logic
├── sw.js               — service worker (offline cache)
├── manifest.json       — PWA manifest
├── tests/              — Node test suite (`npm test`)
├── docs/mvp-spec.md    — product decisions & roadmap
└── archive/            — abandoned native Android/Capacitor build (not used)
```

## Tests

```
npm test
```

## Notes

A native Android (Capacitor) packaging route was explored and **abandoned** in
favor of the PWA. The discarded native project is preserved under
`archive/android-capacitor/` and is not part of the live app.
