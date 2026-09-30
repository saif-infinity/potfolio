"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { site } from "@/data/site";
import { Icon } from "@/components/icons";
import {
  RevealGroup,
  SectionHeader,
  revealItem,
  useRevealOnScroll,
} from "@/components/motion/Reveal";

type Box = { l: number; r: number; t: number; b: number };

type BranchGeom = { y: number; dotL: number; dotR: number };

type NetGeom = {
  w: number;
  h: number;
  trunkX: number;
  trunkY1: number;
  trunkY2: number;
  hubDotY: number;
  rows: BranchGeom[];
};

const netWrap: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.9 } },
};

const drawV: Variants = {
  hidden: { pathLength: 0 },
  show: { pathLength: 1, transition: { duration: 0.45, ease: "easeOut" } },
};

const dotV: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3 } },
};

const DOT_R = 2.5;
const DOT_GAP = 4;
const CARD_REST = 7;
const CARD_PULL = 18;
const CARD_SIGMA = 170;
const CARD_MAX = 14;
const ACTIVE_DAMP = 0.35;

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type CardSim = {
  rx: number;
  ry: number;
  tx: number;
  ty: number;
  next: number;
  ox: number;
  oy: number;
};

function nodeAnchor(g: NetGeom, i: number): { x: number; y: number } {
  if (i === 0) return { x: g.trunkX, y: g.hubDotY };
  const r = g.rows[(i - 1) >> 1];
  return { x: i % 2 === 1 ? r.dotL : r.dotR, y: r.y };
}

function clampCard(ox: number, oy: number): { x: number; y: number } {
  if (ox > CARD_MAX) ox = CARD_MAX;
  else if (ox < -CARD_MAX) ox = -CARD_MAX;
  if (oy > CARD_MAX) oy = CARD_MAX;
  else if (oy < -CARD_MAX) oy = -CARD_MAX;
  return { x: ox, y: oy };
}

export function WhatIDoSection() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const dotGRefs = useRef<Array<SVGGElement | null>>([]);
  const branchRefs = useRef<Array<SVGPathElement | null>>([]);
  const trunkRef = useRef<SVGPathElement | null>(null);
  const geomRef = useRef<NetGeom | null>(null);
  const simRef = useRef<Array<CardSim> | null>(null);
  const ptrRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, p: 0, pt: 0 });
  const visRef = useRef(true);
  const hidRef = useRef(false);
  const rngRef = useRef<(() => number) | null>(null);
  const reduceMotion = useReducedMotion();
  // Same race-proof reveal as Reveal/RevealGroup: the SVG draw must not be
  // stranded at pathLength 0 if a fast flick skips its trigger moment.
  const [netRef, netRevealed] = useRevealOnScroll<SVGGElement>();
  const [geom, setGeom] = useState<NetGeom | null>(null);
  const [active, setActive] = useState(0);
  geomRef.current = geom;

  const activeRef = useRef(0);
  activeRef.current = active;

  if (!rngRef.current) rngRef.current = mulberry32(0xc0ffee);

  const resetCardTransforms = () => {
    for (const el of cardRefs.current) {
      el?.style.removeProperty("transform");
    }
  };

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let alive = true;
    const mq = window.matchMedia("(min-width: 640px)");

    const measure = () => {
      if (!alive) return;
      if (!mq.matches) {
        setGeom(null);
        resetCardTransforms();
        return;
      }
      const cards = cardRefs.current;
      if (cards.length < 5 || cards.some((el) => !el)) return;
      const wb = wrap.getBoundingClientRect();
      if (wb.width < 1 || wb.height < 1) return;
      // Layout geometry, NOT getBoundingClientRect: the cards carry a
      // reveal transform (y: 28) and a per-card stagger, so rects read
      // mid-animation are offset from where the cards come to rest, and
      // ResizeObserver will not fire again once they land. The per-frame
      // drift lives on the same inner elements but offset* ignores
      // transforms, so this walk always returns the rest position.
      const rel = (el: HTMLElement): Box => {
        let l = 0;
        let t = 0;
        for (let n: HTMLElement | null = el; n && n !== wrap; n = n.offsetParent as HTMLElement | null) {
          l += n.offsetLeft;
          t += n.offsetTop;
        }
        return { l, t, r: l + el.offsetWidth, b: t + el.offsetHeight };
      };
      const hub = rel(cards[0] as HTMLElement);
      const nodes = [1, 2, 3, 4].map((i) => rel(cards[i] as HTMLElement));
      const trunkX = wb.width / 2;
      const rows: BranchGeom[] = [0, 2].map((k) => {
        const top = Math.min(nodes[k].t, nodes[k + 1].t);
        const bottom = Math.max(nodes[k].b, nodes[k + 1].b);
        return {
          y: (top + bottom) / 2,
          dotL: nodes[k].r + DOT_GAP,
          dotR: nodes[k + 1].l - DOT_GAP,
        };
      });
      setGeom({
        w: wb.width,
        h: wb.height,
        trunkX,
        trunkY1: hub.b,
        trunkY2: rows[1].y,
        hubDotY: hub.b + DOT_GAP + DOT_R,
        rows,
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    const onMq = () => measure();
    mq.addEventListener("change", onMq);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      alive = false;
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  useLayoutEffect(() => {
    if (reduceMotion) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    let running = false;
    const rng = rngRef.current as () => number;

    const step = (t: number) => {
      // Stop instead of spinning when there is nothing to animate, and
      // restart only when there is again. A loop that re-arms itself
      // before these guards burns 60fps forever while off-screen, on a
      // hidden tab, and on mobile where geom stays null.
      if (!running) return;
      raf = requestAnimationFrame(step);
      if (!visRef.current || hidRef.current) {
        running = false;
        cancelAnimationFrame(raf);
        return;
      }
      const g = geomRef.current;
      if (!g) {
        running = false;
        cancelAnimationFrame(raf);
        return;
      }
      let sim = simRef.current;
      if (!sim) {
        sim = Array.from({ length: 5 }, () => ({
          rx: 0,
          ry: 0,
          tx: 0,
          ty: 0,
          next: t + 1200 + rng() * 1800,
          ox: 0,
          oy: 0,
        }));
        simRef.current = sim;
      }
      const ptr = ptrRef.current;
      ptr.x += (ptr.tx - ptr.x) * 0.2;
      ptr.y += (ptr.ty - ptr.y) * 0.2;
      ptr.p += (ptr.pt - ptr.p) * 0.08;
      const pos: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < 5; i++) {
        const d = sim[i];
        const a = nodeAnchor(g, i);
        if (t >= d.next) {
          const ang = rng() * Math.PI * 2;
          const mag = Math.sqrt(rng()) * CARD_REST;
          d.tx = Math.cos(ang) * mag;
          d.ty = Math.sin(ang) * mag;
          d.next = t + 2000 + rng() * 1800;
        }
        d.rx += (d.tx - d.rx) * 0.035;
        d.ry += (d.ty - d.ry) * 0.035;
        const cx = a.x + d.rx;
        const cy = a.y + d.ry;
        const vx = ptr.x - cx;
        const vy = ptr.y - cy;
        const dist2 = vx * vx + vy * vy;
        const wgt = ptr.p * CARD_PULL * Math.exp(-dist2 / (2 * CARD_SIGMA * CARD_SIGMA));
        const dist = Math.sqrt(dist2) || 1;
        const c = clampCard(d.rx + (vx / dist) * wgt, d.ry + (vy / dist) * wgt);
        const damp = i === activeRef.current ? ACTIVE_DAMP : 1;
        const fx = c.x * damp;
        const fy = c.y * damp;
        d.ox = fx;
        d.oy = fy;
        pos.push({ x: a.x + fx, y: a.y + fy });
        cardRefs.current[i]?.style.setProperty(
          "transform",
          `translate(${fx.toFixed(2)}px, ${fy.toFixed(2)}px)`,
        );
        dotGRefs.current[i]?.setAttribute("transform", `translate(${fx.toFixed(2)} ${fy.toFixed(2)})`);
      }
      const hub = pos[0];
      trunkRef.current?.setAttribute(
        "d",
        `M ${hub.x.toFixed(2)} ${hub.y.toFixed(2)} L ${g.trunkX} ${g.trunkY2}`,
      );
      for (let r = 0; r < 2; r++) {
        const row = g.rows[r];
        const l = pos[r * 2 + 1];
        const rr = pos[r * 2 + 2];
        branchRefs.current[r]?.setAttribute(
          "d",
          `M ${g.trunkX} ${row.y} L ${l.x.toFixed(2)} ${l.y.toFixed(2)} M ${g.trunkX} ${row.y} L ${rr.x.toFixed(2)} ${rr.y.toFixed(2)}`,
        );
      }
    };

    const start = () => {
      if (running) return;
      if (!geomRef.current || !visRef.current || hidRef.current) return;
      running = true;
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visRef.current = entries[0]?.isIntersecting ?? true;
        if (visRef.current) start();
      },
      { threshold: 0 },
    );
    io.observe(wrap);
    const onVis = () => {
      hidRef.current = document.hidden;
      if (!hidRef.current) start();
    };
    document.addEventListener("visibilitychange", onVis);

    start();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      resetCardTransforms();
    };
  }, [reduceMotion, geom]);

  const onWrapMouseMove = (e: React.MouseEvent) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const ptr = ptrRef.current;
    ptr.tx = e.clientX - r.left;
    ptr.ty = e.clientY - r.top;
    ptr.pt = 1;
  };

  const onWrapMouseLeave = () => {
    ptrRef.current.pt = 0;
  };

  const nodePos = (i: number) => {
    if (!geom) return { x: 0, y: 0 };
    return nodeAnchor(geom, i);
  };

  const branchD = (r: number) => {
    if (!geom) return "";
    const row = geom.rows[r];
    const l = nodePos(r * 2 + 1);
    const rr = nodePos(r * 2 + 2);
    return `M ${geom.trunkX} ${row.y} L ${l.x} ${l.y} M ${geom.trunkX} ${row.y} L ${rr.x} ${rr.y}`;
  };

  const service = site.services[active];

  return (
    <section id="services" className="relative scroll-mt-24 pb-20 pt-24 sm:pt-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-14">
          <SectionHeader
            title="WHAT I DO"
            sub="Five things I build well enough to ship, and keep shipping."
          />

          <div
            ref={wrapRef}
            className="relative"
            onMouseMove={reduceMotion ? undefined : onWrapMouseMove}
            onMouseLeave={reduceMotion ? undefined : onWrapMouseLeave}
          >
            {geom ? (
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full sm:block"
                width={geom.w}
                height={geom.h}
              >
                <motion.g
                  ref={netRef}
                  initial={reduceMotion ? false : "hidden"}
                  animate={netRevealed ? "show" : undefined}
                  variants={netWrap}
                >
                  <motion.path
                    ref={(el) => {
                      trunkRef.current = el;
                    }}
                    d={`M ${geom.trunkX} ${geom.hubDotY} L ${geom.trunkX} ${geom.trunkY2}`}
                    className="stroke-primary"
                    strokeWidth={1}
                    fill="none"
                    opacity={active === 0 ? 0.7 : 0.3}
                    variants={drawV}
                  />
                  {geom.rows.map((row, r) => (
                    <motion.path
                      key={`branch-${r}`}
                      ref={(el) => {
                        branchRefs.current[r] = el;
                      }}
                      d={branchD(r)}
                      className="stroke-primary"
                      strokeWidth={1}
                      fill="none"
                      opacity={active === r * 2 + 1 || active === r * 2 + 2 ? 0.9 : 0.4}
                      variants={drawV}
                    />
                  ))}
                  {/* The outer motion.g animates opacity only. The per-frame
                      transform is written to the inner plain <g>, because
                      framer-motion owns the transform of a motion component
                      and would reset it on any re-render (e.g. active). */}
                  {([0, 1, 2, 3, 4] as const).map((i) => {
                    const p = nodePos(i);
                    const lit = active === i;
                    return (
                      <motion.g key={`dot-${i}`} variants={dotV}>
                        <g
                          ref={(el) => {
                            dotGRefs.current[i] = el;
                          }}
                        >
                          {lit ? (
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={7}
                              className="stroke-primary"
                              strokeWidth={1}
                              fill="none"
                              opacity={0.5}
                            />
                          ) : null}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={lit ? 3.5 : DOT_R}
                            strokeWidth={1}
                            className={lit ? "fill-primary stroke-primary" : "fill-bg stroke-primary"}
                          />
                        </g>
                      </motion.g>
                    );
                  })}
                </motion.g>
              </svg>
            ) : null}

            <RevealGroup className="relative z-[1] grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-8">
              {site.services.map((svc, i) => {
                const lit = active === i;
                return (
                  <motion.button
                    key={svc.title}
                    type="button"
                    variants={revealItem}
                    aria-describedby={`svc-blurb-${i}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    className={
                      i === 0
                        ? "group w-full text-left sm:col-span-2 sm:flex sm:justify-center"
                        : i % 2 === 0
                          ? "group w-full text-left sm:mx-auto sm:mt-12 sm:max-w-[240px]"
                          : "group w-full text-left sm:mx-auto sm:max-w-[240px]"
                    }
                  >
                    <span
                      ref={(el) => {
                        cardRefs.current[i] = el;
                      }}
                      className={
                        lit
                          ? `relative block rounded-xl border border-primary/50 glass px-4 py-3 shadow-glow transition-colors duration-300 will-change-transform ${i === 0 ? "w-full sm:w-auto sm:min-w-[300px]" : "w-full"}`
                          : `relative block rounded-xl border border-hairline glass px-4 py-3 transition-colors duration-300 will-change-transform hover:border-primary/50 ${i === 0 ? "w-full sm:w-auto sm:min-w-[300px]" : "w-full"}`
                      }
                    >
                      <span
                        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 shadow-glow transition-opacity duration-300 group-hover:opacity-100"
                        aria-hidden="true"
                      />

                      <span className="relative flex items-center gap-3">
                        <span
                          className={
                            lit
                              ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors duration-300"
                              : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white"
                          }
                        >
                          <Icon name={svc.icon} className="h-4 w-4" />
                        </span>

                        <span className="min-w-0 flex-1 font-display text-[13px] font-bold leading-snug tracking-tight text-fg">
                          {svc.title}
                        </span>

                        <span
                          className={
                            lit
                              ? "h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                              : "h-1.5 w-1.5 shrink-0 rounded-full bg-hairline transition-colors duration-300 group-hover:bg-primary"
                          }
                          aria-hidden="true"
                        />
                      </span>
                    </span>
                  </motion.button>
                );
              })}
            </RevealGroup>

            {/* Visual readout only. Deliberately NOT aria-live: it follows the
                active node, which changes on hover, and hover-driven live-region
                updates queue a screen reader announcement per node instead of
                interrupting. The accessible copy is the sr-only list below. */}
            <div className="mt-10 min-h-[132px] border-t border-hairline pt-6">
              <motion.div
                key={active}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.21, 0.47, 0.32, 0.98] }}
              >
                <p className="text-[10px] font-semibold tracking-widest2 text-muted">
                  ACTIVE NODE — {String(active + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-fg">
                  {service.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {service.blurb}
                </p>
              </motion.div>
            </div>

            {/* Every blurb stays in the DOM and is associated with its node,
                so assistive tech gets the full copy on focus regardless of
                which node happens to be active. */}
            <span className="sr-only">
              {site.services.map((svc, i) => (
                <span key={svc.title} id={`svc-blurb-${i}`}>
                  {svc.blurb}
                </span>
              ))}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
