"use client";

import { site } from "@/data/site";
import { Icon } from "@/components/icons";
import {
  RevealGroup,
  SectionHeader,
  revealItem,
} from "@/components/motion/Reveal";
import { motion } from "framer-motion";

export function ProjectsSection() {
  return (
    <section
      id="projects"
      className="relative scroll-mt-24 border-y border-hairline bg-bg2/30 py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <SectionHeader
          title="FEATURED PROJECTS"
          sub="Things I designed, built and actually deployed."
          align="right"
        />

        <RevealGroup className="space-y-10 lg:space-y-16">
          {site.projects.map((project, i) => {
            const flipped = i % 2 === 1;
            return (
              <motion.article
                key={project.title}
                variants={revealItem}
                className="grid items-center gap-6 lg:grid-cols-12 lg:gap-10"
              >
                <div
                  className={
                    flipped
                      ? "group relative overflow-hidden rounded-2xl border border-hairline glass p-7 transition-colors duration-300 hover:border-primary/50 lg:order-2 lg:col-span-7"
                      : "group relative overflow-hidden rounded-2xl border border-hairline glass p-7 transition-colors duration-300 hover:border-primary/50 lg:col-span-7"
                  }
                >
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden="true"
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                      <Icon name={project.icon} className="h-5 w-5" />
                    </span>
                    <span className="text-[10px] font-semibold tracking-widest2 text-muted">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="relative mt-6 font-display text-xl font-bold tracking-tight text-fg">
                    {project.title}
                  </h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-muted">
                    {project.blurb}
                  </p>

                  <ul className="relative mt-6 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-hairline bg-white/[0.03] px-3 py-1 text-[10px] font-semibold tracking-widest text-muted"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  aria-hidden="true"
                  className={
                    flipped
                      ? "hidden select-none lg:order-1 lg:col-span-5 lg:block lg:text-right"
                      : "hidden select-none lg:col-span-5 lg:block"
                  }
                >
                  <span className="font-display text-8xl font-extrabold leading-none tracking-tight text-fg/10">
                    0{i + 1}
                  </span>
                  <span className="mt-4 block h-px w-full bg-hairline" />
                </div>
              </motion.article>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
