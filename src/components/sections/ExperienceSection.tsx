"use client";

import { site } from "@/data/site";
import { Icon } from "@/components/icons";
import { Reveal, SectionHeader } from "@/components/motion/Reveal";

export function ExperienceSection() {
  return (
    <section id="experience" className="relative scroll-mt-24 py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeader
              title="EXPERIENCE"
              sub="Leadership and engineering work I've carried."
            />
          </div>

          <ol className="relative mt-2 border-l border-hairline pl-8 sm:pl-12 lg:mt-1">
            {site.experience.map((item, i) => (
              <Reveal key={item.role} delay={i * 0.12} className="relative pb-12 last:pb-0">
                <span
                  className="absolute -left-[38px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border border-primary/50 bg-bg sm:-left-[55px]"
                  aria-hidden="true"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow-sm" />
                </span>

                <span className="text-[10px] font-semibold tracking-widest2 text-primary">
                  {item.period}
                </span>

                <h3 className="mt-2 font-display text-xl font-bold tracking-tight text-fg">
                  {item.role}
                </h3>
                <p className="mt-1 text-sm font-medium text-muted">{item.org}</p>

                <ul className="mt-4 space-y-2.5">
                  {item.points.map((point) => (
                    <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <Icon
                        name="arrowUpRight"
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
