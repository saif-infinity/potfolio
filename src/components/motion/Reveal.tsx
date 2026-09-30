"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Reveal-on-scroll that cannot be stranded at opacity 0.
 *
 * Why not plain `whileInView` + `once: true`? framer-motion's InViewFeature
 * early-returns unless the intersection state actually *changes*
 * (`if (this.isInView === isIntersecting) return;` in
 * framer-motion/dist/es/motion/features/viewport/index.mjs). If an element
 * scrolls past entirely between two delivered IntersectionObserver callbacks,
 * framer only ever observes the net state and never the transient `true`, so
 * the reveal is missed permanently. Under main-thread pressure — heavy
 * sections running rAF loops and SVG path animations — callbacks arrive late
 * and coalesced, which we measured as random permanently invisible headers on
 * fast scroll (0-2 per run, flaky at any viewport margin value).
 *
 * Note that *polling* "is it in view right now" is not a fix either: a 900px
 * flick carries a header across the whole trigger band in ~58ms, which any
 * sampling interval coarse enough to be cheap will step straight over. Both IO
 * and rAF are main-thread bound, so neither can be relied on to be scheduled
 * during that window.
 *
 * So the question asked is not "is it visible now" (a sampling question, with
 * gaps) but "has the accumulated scroll position already passed this element"
 * (a monotonic comparison, with none). `scrollY` only ever accumulates, and the
 * threshold is derived from the element's own document offset, so any single
 * jump large enough to carry the viewport past the element also satisfies the
 * comparison in that same event. There is no interval to step over.
 *
 * Visibility is the guaranteed floor; the animation is the enhancement.
 * Listeners tear down the instant the reveal latches, so there is no ongoing
 * per-frame cost once revealed.
 */

/** Slack below the viewport, in px, so elements reveal slightly early. */
const REVEAL_MARGIN = 120;

/**
 * True once the top of the viewport has travelled to the element's document
 * position. Monotonic in `scrollY`, hence immune to skipped frames.
 */
function scrollHasPassed(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const h = window.innerHeight || document.documentElement.clientHeight;
  const docTop = r.top + (window.scrollY || window.pageYOffset || 0);
  const scrollY = window.scrollY || window.pageYOffset || 0;
  return scrollY + h >= docTop - REVEAL_MARGIN;
}

export function useRevealOnScroll<T extends Element = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (revealed) return;
    const el = ref.current;
    if (!el) return;

    // Narrowed to non-null so the closures below keep the type.
    const node: Element = el;

    // Already passed on mount: deep link, restored scroll, or back/forward.
    if (scrollHasPassed(node)) {
      setRevealed(true);
      return;
    }

    let stopped = false;

    const finish = () => {
      if (stopped) return;
      stopped = true;
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      setRevealed(true);
    };

    function check() {
      if (scrollHasPassed(node)) finish();
    }

    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);

    return () => {
      stopped = true;
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [revealed]);

  return [ref, revealed] as const;
}

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [ref, revealed] = useRevealOnScroll<HTMLDivElement>();
  const shouldReveal = reduceMotion || revealed;

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : { opacity: 0, y }}
      animate={shouldReveal ? { opacity: 1, y: 0 } : undefined}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({
  children,
  className = "",
  stagger = 0.09,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [ref, revealed] = useRevealOnScroll<HTMLDivElement>();
  const shouldReveal = reduceMotion || revealed;

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? false : "hidden"}
      animate={shouldReveal ? "show" : undefined}
      variants={
        reduceMotion
          ? {}
          : {
              hidden: {},
              show: { transition: { staggerChildren: stagger } },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const revealItem = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] as const },
  },
};

export function SectionHeader({
  title,
  sub,
  align = "left",
}: {
  title: string;
  sub?: string;
  align?: "left" | "right";
}) {
  const right = align === "right";
  return (
    <Reveal className={right ? "mb-12 pt-9 text-right sm:mb-14" : "mb-12 pt-9 text-left sm:mb-14"}>
      <h2 className="font-display text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
        {title}
      </h2>
      {sub ? (
        <p
          className={
            right
              ? "ml-auto mt-4 max-w-2xl text-base text-muted sm:text-lg"
              : "mt-4 max-w-2xl text-base text-muted sm:text-lg"
          }
        >
          {sub}
        </p>
      ) : null}
    </Reveal>
  );
}