"use client";

import { site } from "@/data/site";
import {
  Reveal,
  RevealGroup,
  SectionHeader,
  revealItem,
  useRevealOnScroll,
} from "@/components/motion/Reveal";
import { motion, useReducedMotion } from "framer-motion";

type Language = (typeof site.languages)[number];

function LanguageBar({
  language,
  delay,
  reduceMotion,
}: {
  language: Language;
  delay: number;
  reduceMotion: boolean;
}) {
  const [barRef, revealed] = useRevealOnScroll<HTMLSpanElement>();

  return (
    <li>
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-sm font-semibold text-fg">{language.label}</p>
        <p className="text-right text-xs text-muted">{language.level}</p>
      </div>
      <div aria-hidden="true" className="relative mt-2.5 h-px bg-hairline">
        <motion.span
          ref={barRef}
          className="absolute left-0 top-1/2 block h-[3px] -translate-y-1/2 rounded-full bg-primary"
          initial={reduceMotion ? false : { width: 0 }}
          animate={revealed ? { width: `${language.meter * 100}%` } : undefined}
          transition={{ duration: 0.9, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
        />
      </div>
    </li>
  );
}

export function EducationSection() {
  const [lead, ...rest] = site.education;
  const reduceMotion = useReducedMotion();
  return (
    <section id="education" className="relative scroll-mt-24 py-20 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeader
          title="EDUCATION"
          sub="Formal study and working languages."
        />

        <RevealGroup>
          <motion.div variants={revealItem} className="relative px-2 py-8 sm:px-8">
            <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-white/20" />
            <span aria-hidden="true" className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-white/20" />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-white/20" />
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-white/20" />

            <p className="text-[10px] font-semibold tracking-widest2 text-primary">
              {lead.period}
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-fg sm:text-3xl">
              {lead.qualification}
            </h3>
            <p className="mt-1.5 text-sm font-medium text-muted">
              {lead.org}
              {lead.speciality ? ` · ${lead.speciality}` : null}
            </p>
            {lead.note ? (
              <p className="mt-4 flex items-center gap-2.5 text-sm font-semibold text-fg">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {lead.note}
              </p>
            ) : null}
            {lead.subjects.length > 0 ? (
              <ul className="mt-5 flex flex-wrap gap-2">
                {lead.subjects.map((subject) => (
                  <li
                    key={subject}
                    className="rounded-lg border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted"
                  >
                    {subject}
                  </li>
                ))}
              </ul>
            ) : null}
          </motion.div>

          {rest.map((entry) => (
            <motion.div
              key={entry.qualification}
              variants={revealItem}
              className="grid gap-2 border-t border-hairline py-6 sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-8"
            >
              <div>
                <h3 className="font-display text-base font-bold tracking-tight text-fg">
                  {entry.qualification}
                </h3>
                <p className="mt-1 text-sm text-muted">{entry.org}</p>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:justify-end sm:text-right">
                <span className="text-[10px] font-semibold tracking-widest2 text-muted">
                  {entry.period}
                </span>
                {entry.note ? (
                  <span className="text-xs font-semibold text-primary">
                    {entry.note}
                  </span>
                ) : null}
              </div>
              {entry.subjects.length > 0 ? (
                <ul className="flex flex-wrap gap-2 sm:col-span-2">
                  {entry.subjects.map((subject) => (
                    <li
                      key={subject}
                      className="rounded-lg border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted"
                    >
                      {subject}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          ))}
        </RevealGroup>

        <Reveal className="mt-10">
          <div className="border-t border-hairline pt-6">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[10px] font-semibold tracking-widest2 text-muted">
                LANGUAGES
              </p>
              <p className="text-[10px] tracking-widest2 text-muted">
                QUALITATIVE — AS DECLARED
              </p>
            </div>
            <ul className="mt-5 space-y-5">
              {site.languages.map((language, i) => (
                <LanguageBar
                  key={language.label}
                  language={language}
                  delay={0.15 + i * 0.15}
                  reduceMotion={!!reduceMotion}
                />
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
