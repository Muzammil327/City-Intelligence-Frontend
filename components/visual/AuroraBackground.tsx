"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * The wash the glass panels float over.
 *
 * Two things are happening: slow-drifting colour blobs that give the frosted
 * surfaces something to refract, and a faint skyline that anchors the page to
 * its subject. Both are decorative — `aria-hidden`, no pointer events, and
 * fixed behind every layer.
 *
 * Only `transform` and `opacity` animate, so this never triggers layout and
 * never shifts a pixel of content.
 */

interface Blob {
  className: string;
  /** Drift path, in percent of the blob's own size. */
  x: [number, number, number];
  y: [number, number, number];
  duration: number;
}

const BLOBS: readonly Blob[] = [
  {
    className:
      "left-[-10%] top-[-18%] size-[42rem] bg-[radial-gradient(circle,oklch(0.62_0.19_35/28%),transparent_65%)]",
    x: [0, 8, 0],
    y: [0, 6, 0],
    duration: 26,
  },
  {
    className:
      "right-[-14%] top-[-6%] size-[38rem] bg-[radial-gradient(circle,oklch(0.55_0.18_305/24%),transparent_65%)]",
    x: [0, -7, 0],
    y: [0, 9, 0],
    duration: 32,
  },
  {
    className:
      "bottom-[-22%] left-[28%] size-[46rem] bg-[radial-gradient(circle,oklch(0.58_0.15_240/20%),transparent_65%)]",
    x: [0, 6, 0],
    y: [0, -8, 0],
    duration: 38,
  },
];

/** Deterministic skyline — a literal, so server and client render identically. */
const SKYLINE: ReadonlyArray<[x: number, width: number, height: number]> = [
  [0, 46, 58], [52, 30, 34], [88, 38, 74], [132, 26, 44], [164, 52, 96],
  [222, 34, 52], [262, 44, 68], [312, 28, 38], [346, 56, 88], [408, 32, 48],
  [446, 40, 64], [492, 26, 36], [524, 50, 82], [580, 36, 54], [622, 44, 70],
  [672, 28, 40], [706, 54, 92], [766, 34, 50], [806, 42, 66], [854, 30, 42],
  [890, 48, 78], [944, 36, 56],
];

export function AuroraBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {BLOBS.map((blob, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl ${blob.className}`}
          animate={
            prefersReducedMotion
              ? undefined
              : { x: blob.x.map((v) => `${v}%`), y: blob.y.map((v) => `${v}%`) }
          }
          transition={{
            duration: blob.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Skyline, barely there — it should register as texture, not decoration. */}
      <svg
        className="absolute inset-x-0 top-0 h-40 w-full text-foreground/[0.035]"
        viewBox="0 0 980 100"
        preserveAspectRatio="none"
        fill="currentColor"
      >
        {SKYLINE.map(([x, width, height]) => (
          <rect key={x} x={x} y={100 - height} width={width} height={height} />
        ))}
      </svg>

      {/* Settles the top edge so the skyline fades rather than stops. */}
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}
