"use client";

import { motion } from "motion/react";
import type { ComponentProps, ReactNode } from "react";

import { riseIn, stagger } from "@/lib/motion";

/**
 * Entrance choreography.
 *
 * `RevealGroup` releases its children in sequence; `Reveal` is one child. Both
 * animate opacity and transform only, so nothing reflows and no panel shifts
 * under a pointer mid-animation.
 *
 * Reduced motion is handled globally by `MotionConfig` in `app/providers.tsx`,
 * which is why neither component checks for it.
 */

type DivProps = ComponentProps<typeof motion.div>;

interface RevealProps extends Omit<DivProps, "variants" | "children"> {
  children: ReactNode;
}

export function RevealGroup({ children, ...props }: RevealProps) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Reveal({ children, ...props }: RevealProps) {
  return (
    <motion.div variants={riseIn} {...props}>
      {children}
    </motion.div>
  );
}
