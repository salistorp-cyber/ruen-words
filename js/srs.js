// SM-2 spaced repetition algorithm
// grade: 0=Again, 1=Hard, 2=Good, 3=Easy

const SRS = (() => {
  const EASE_MIN = 1.3;
  const EASE_DEFAULT = 2.5;

  function createCard(id) {
    return {
      id,
      interval: 1,
      repetitions: 0,
      easeFactor: EASE_DEFAULT,
      nextReview: Date.now(),
    };
  }

  function rate(card, grade) {
    const c = { ...card };
    const now = Date.now();
    const DAY = 86400000;

    if (grade === 0) {
      // Again: reset scheduling, lower ease, and let the session queue handle any immediate retry.
      c.repetitions = 0;
      c.interval = 1;
      c.easeFactor = Math.max(EASE_MIN, c.easeFactor - 0.2);
    } else if (grade === 1) {
      // Hard — slow growth, penalise ease
      c.interval = Math.max(1, Math.round(c.interval * 1.2));
      c.easeFactor = Math.max(EASE_MIN, c.easeFactor - 0.15);
      c.repetitions += 1;
    } else if (grade === 2) {
      // Good — standard SM-2 progression
      if (c.repetitions === 0) {
        c.interval = 1;
      } else if (c.repetitions === 1) {
        c.interval = 6;
      } else {
        c.interval = Math.round(c.interval * c.easeFactor);
      }
      c.repetitions += 1;
    } else if (grade === 3) {
      // Easy — accelerate and boost ease
      if (c.repetitions === 0) {
        c.interval = 4;
      } else {
        c.interval = Math.round(c.interval * c.easeFactor * 1.3);
      }
      c.easeFactor += 0.15;
      c.repetitions += 1;
    }

    c.nextReview = now + c.interval * DAY;
    return c;
  }

  function isDue(card) {
    return card.nextReview <= Date.now();
  }

  return { createCard, rate, isDue };
})();
