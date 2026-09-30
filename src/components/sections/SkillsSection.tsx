"use client";

import { site } from "@/data/site";
import { Icon } from "@/components/icons";
import {
  RevealGroup,
  SectionHeader,
  revealItem,
} from "@/components/motion/Reveal";
import { motion } from "framer-motion";

export function SkillsSection() {
  return (
    <section
      id="skills"
      className="relative scroll-mt-24 border-y border-hairline bg-bg2/30 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeader
          title="SKILLS"
          sub="The stack I reach for, grouped by what I actually use it for."
        />

        <RevealGroup>
          {site.skills.map((group, i) => (
            <motion.div
              key={group.group}
              variants={revealItem}
              className={
                i === site.skills.length - 1
                  ? "grid gap-4 border-y border-hairline py-6 sm:grid-cols-[240px_1fr] sm:gap-8"
                  : "grid gap-4 border-t border-hairline py-6 sm:grid-cols-[240px_1fr] sm:gap-8"
              }
            >
              <div className="flex items-center gap-3">
                <span className="font-display text-xs font-bold tracking-widest text-muted">
                  0{i + 1}
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                  <Icon name={group.icon} className="h-4 w-4" />
                </span>
                <h3 className="font-display text-sm font-bold tracking-widest text-fg">
                  {group.group.toUpperCase()}
                </h3>
              </div>

              <ul className="flex flex-wrap content-center gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-hairline bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-muted transition-all duration-300 hover:border-primary/40 hover:text-primary"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
