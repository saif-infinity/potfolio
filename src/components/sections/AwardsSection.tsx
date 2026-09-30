"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/icons";
import {
  Reveal,
  RevealGroup,
  SectionHeader,
  revealItem,
} from "@/components/motion/Reveal";
import { getCertificates } from "@/components/certificates/certificates";
import { initCertStage } from "@/components/certificates/certStage";
import styles from "@/components/certificates/certificates.module.css";

export function AwardsSection() {
  const certs = getCertificates();
  const [active, setActive] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const stageRef = useRef<ReturnType<typeof initCertStage> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const slots = certs
      .map((cert, i) => {
        const el = stageRefs.current[i];
        return el ? { el, cert } : null;
      })
      .filter((s): s is { el: HTMLDivElement; cert: (typeof certs)[number] } =>
        s !== null,
      );
    if (slots.length === 0) return;
    const stage = initCertStage(canvas, section, slots);
    stageRef.current = stage;
    stage.setActive(active);
    return () => {
      stageRef.current = null;
      stage.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The press draws one sheet at a time, so selection has to reach WebGL.
  useEffect(() => {
    stageRef.current?.setActive(active);
  }, [active]);

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key !== "ArrowDown" &&
      e.key !== "ArrowUp" &&
      e.key !== "Home" &&
      e.key !== "End"
    ) {
      return;
    }
    e.preventDefault();
    let next = active;
    if (e.key === "ArrowDown") next = active + 1;
    if (e.key === "ArrowUp") next = active - 1;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = certs.length - 1;
    next = (next + certs.length) % certs.length;
    setActive(next);
    rowRefs.current[next]?.focus();
  };

  const cert = certs[active];

  return (
    <section
      id="awards"
      ref={sectionRef}
      className="relative scroll-mt-24 pb-24 pt-16 sm:pb-28 sm:pt-20"
    >
      <canvas ref={canvasRef} className={styles.gl} aria-hidden="true" />
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeader
          title="TRAINING"
          sub="Three courses and one CTF placement on the registry press. Select a record to change the sheet — drag it to turn."
        />

        <Reveal className="mb-10">
          <div className="-mr-6 h-px bg-hairline lg:-mr-10" aria-hidden="true" />
        </Reveal>

        <div className="grid items-start gap-10 lg:grid-cols-[340px_1fr] lg:gap-14">
          <Reveal className="mx-auto w-full max-w-[320px] lg:max-w-none">
            <div
              id="cert-panel"
              role="tabpanel"
              aria-label={`3D parchment certificate: ${cert.fullTitle}, issued by ${cert.issuer}`}
              className="relative overflow-hidden border border-hairline"
            >
              <div aria-hidden="true" className="pointer-events-none absolute left-4 top-4 z-20 h-3 w-3 border-l border-t border-white/20" />
              <div aria-hidden="true" className="pointer-events-none absolute right-4 top-4 z-20 h-3 w-3 border-r border-t border-white/20" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-4 left-4 z-20 h-3 w-3 border-b border-l border-white/20" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-4 right-4 z-20 h-3 w-3 border-b border-r border-white/20" />
              <div className="relative aspect-[3/4]">
                {certs.map((c, i) => (
                  <div
                    key={c.slug}
                    ref={(el) => {
                      stageRefs.current[i] = el;
                    }}
                    className={styles.stage}
                    aria-hidden={i === active ? undefined : true}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 0,
                      // One sheet is painted by WebGL into this rect; the
                      // unselected ones stay inert measurement boxes.
                      pointerEvents: i === active ? "auto" : "none",
                    }}
                  >
                    {i === active ? (
                      <span className={styles.hint} aria-hidden="true">
                        drag to turn
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <RevealGroup>
            <div role="tablist" aria-label="Training records" onKeyDown={onListKeyDown}>
              {certs.map((c, i) => {
                const on = i === active;
                return (
                  <motion.button
                    key={c.slug}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    aria-controls="cert-panel"
                    onClick={() => setActive(i)}
                    variants={revealItem}
                    className={
                      i === certs.length - 1
                        ? "group flex w-full items-center gap-4 border-y border-hairline px-2 py-5 text-left transition-colors duration-300 hover:bg-white/[0.02] sm:gap-6 sm:px-4"
                        : "group flex w-full items-center gap-4 border-t border-hairline px-2 py-5 text-left transition-colors duration-300 hover:bg-white/[0.02] sm:gap-6 sm:px-4"
                    }
                  >
                    <span
                      className={
                        on
                          ? "font-display text-xs font-bold tracking-widest text-primary"
                          : "font-display text-xs font-bold tracking-widest text-muted"
                      }
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        on
                          ? "min-w-0 flex-1 font-display text-base font-bold tracking-tight text-fg sm:text-lg"
                          : "min-w-0 flex-1 font-display text-base font-bold tracking-tight text-muted transition-colors duration-300 group-hover:text-fg sm:text-lg"
                      }
                    >
                      {c.title}
                    </span>
                    {c.year ? (
                      <span className="shrink-0 font-display text-xs font-bold tracking-widest2 text-muted">
                        {c.year}
                      </span>
                    ) : (
                      <span className="shrink-0 font-display text-[10px] font-semibold tracking-widest2 text-muted">
                        COURSE
                      </span>
                    )}
                    {on ? (
                      <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold tracking-widest2 text-primary">
                        ON PRESS
                      </span>
                    ) : (
                      <span
                        className="shrink-0 text-muted opacity-0 transition-all duration-300 group-hover:text-primary group-hover:opacity-100"
                        aria-hidden="true"
                      >
                        <Icon name="arrowUpRight" className="h-4 w-4" />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </RevealGroup>
        </div>

        <Reveal className="mt-10">
          <div className="-ml-6 h-px bg-hairline lg:-ml-10" aria-hidden="true" />
        </Reveal>
      </div>
    </section>
  );
}
