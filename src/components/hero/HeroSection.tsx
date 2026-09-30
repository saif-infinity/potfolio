"use client";

import { motion } from "framer-motion";
import { site, mailto } from "@/data/site";
import { Icon } from "@/components/icons";
import { KineticButton } from "@/components/ui/KineticButton";

export function HeroSection() {
  return (
    <section id="top" className="relative overflow-hidden pt-14 sm:pt-16">
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 z-[1] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-violet/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 lg:grid-cols-12 lg:gap-8 lg:px-10">
        <motion.div
          initial={{ opacity: 0, x: -28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="flex flex-col items-start pt-14 lg:col-span-7"
        >
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl xl:text-7xl">
            {site.shortName.split(" ")[0]}
            <br />
            <span className="text-gradient-primary animate-gradient-x">
              {site.shortName.split(" ").slice(1).join(" ")}
            </span>
            <span className="mt-2 block text-xl font-medium tracking-tight text-muted sm:text-2xl">
              {site.title}
            </span>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted">
            {site.description}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <KineticButton href={mailto("Let's build something")} size="lg" tone="primary">
              GET IN TOUCH
              <Icon name="arrowUpRight" className="relative z-10 ml-1.5 inline h-3.5 w-3.5" />
            </KineticButton>

            <KineticButton href="#projects" size="lg" tone="secondary">
              DOWNLOAD CV
              <Icon
                name="download"
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </KineticButton>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 1, delay: 0.05, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative lg:col-span-5"
        >
          <div className="hero-bloom relative lg:-ml-10">
            <div
              className="absolute -inset-10 rounded-full bg-primary/25 blur-3xl animate-pulse-glow"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -inset-3 z-0 translate-x-4 translate-y-4 rounded-[28px] border border-hairline"
              aria-hidden="true"
            />

            <div className="mask-portrait relative">
              <img
                src="/portrait.jpg"
                alt={`${site.name}, ${site.role.toLowerCase()}`}
                width={1024}
                height={1024}
                // eslint-disable-next-line @next/next/no-img-element
                className="relative z-10 h-[24rem] w-[19rem] rounded-3xl object-cover object-top opacity-95 shadow-card sm:h-[30rem] sm:w-[24rem] lg:h-[34rem] lg:w-[26rem]"
                style={{ filter: "contrast(1.05) saturate(1) brightness(0.95)" }}
              />

              <div
                className="absolute inset-0 z-20 rounded-3xl ring-1 ring-inset ring-primary/40"
                aria-hidden="true"
              />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mt-14 border-y border-hairline sm:mt-16">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-hairline">
          {site.stats.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-4 px-6 py-6 lg:px-10">
              <span className="font-display text-3xl font-extrabold leading-none tracking-tight text-primary sm:text-4xl">
                {stat.value}
              </span>
              <span className="text-[10px] font-semibold tracking-widest2 text-muted">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-5 lg:px-10">
        <ul className="flex items-center gap-1.5 rounded-full border border-hairline glass px-3 py-2.5">
          {site.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="group flex h-10 w-10 items-center justify-center rounded-full text-muted transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/15 hover:text-primary hover:shadow-glow-sm"
              >
                <Icon name={social.icon} className="h-[18px] w-[18px]" />
              </a>
            </li>
          ))}
          <li className="mx-1 h-6 w-px bg-hairline" aria-hidden="true" />
          <li>
            <a
              href={mailto()}
              aria-label="Email"
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/15 hover:text-primary hover:shadow-glow-sm"
            >
              <Icon name="mail" className="h-[18px] w-[18px]" />
            </a>
          </li>
        </ul>

        <a
          href="#services"
          aria-label="Scroll to services"
          className="hidden items-center gap-2 text-[10px] font-semibold tracking-widest2 text-muted transition-colors hover:text-primary sm:flex"
        >
          SCROLL
          <Icon name="chevronDown" className="h-4 w-4 animate-scroll-hint" />
        </a>
      </div>
    </section>
  );
}
