import type { Transition, Variants } from "motion/react";

/**
 * Shared motion vocabulary.
 *
 * One place defines how long things take and how they ease, so the dashboard
 * moves as a single system. A component that needs a duration imports one from
 * here rather than typing a number.
 *
 * Only `transform` and `opacity` are animated anywhere in this file: those are
 * the two properties the compositor can handle without laying the page out
 * again, which is what keeps an entrance from shifting content under a cursor.
 */

/** Matches `--motion-*` in `app/globals.css`. Seconds, as Framer Motion wants. */
export const DURATION = {
  fast: 0.14,
  base: 0.26,
  slow: 0.52,
} as const;

/** The house easing — a soft overshoot-free settle. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = {
  duration: DURATION.base,
  ease: EASE,
};

/** A parent that releases its children one after another. */
export const stagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

/** The standard entrance: up and in. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition },
};

/** For panels swapped in place, where vertical travel would read as a jump. */
export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition },
  exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast, ease: EASE } },
};

/**
 * The sliding tab indicator.
 *
 * A spring rather than a duration: the indicator tracks a layout change, and a
 * fixed duration looks wrong when the distance between two tabs varies.
 */
export const indicatorTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 36,
  mass: 0.7,
};
