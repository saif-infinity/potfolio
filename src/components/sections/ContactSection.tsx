"use client";

import { site, mailto, safeSocials } from "@/data/site";
import { safeHref } from "@/lib/safeHref";
import { Icon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";
import { KineticButton } from "@/components/ui/KineticButton";

export function ContactSection() {
  return (
    <section id="contact" className="relative scroll-mt-24 pb-14 pt-24 sm:pt-28">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="lg:order-1">
            <div className="rounded-2xl border border-hairline glass p-7">
              <h3 className="font-display text-sm font-bold tracking-widest text-fg">
                DETAILS
              </h3>

              <ul className="mt-6 space-y-5">
                <li className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon name="mail" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-widest2 text-muted">
                      EMAIL
                    </p>
                    {mailto() ? (
                      <a
                        href={mailto() ?? undefined}
                        className="break-all text-sm font-medium text-fg transition-colors hover:text-primary"
                      >
                        {site.contact.email}
                      </a>
                    ) : (
                      <span className="break-all text-sm font-medium text-fg">
                        {site.contact.email}
                      </span>
                    )}
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon name="phone" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest2 text-muted">
                      PHONE
                    </p>
                    {safeHref(`tel:${site.contact.phone.replace(/\s/g, "")}`) ? (
                      <a
                        href={safeHref(`tel:${site.contact.phone.replace(/\s/g, "")}`) ?? undefined}
                        className="text-sm font-medium text-fg transition-colors hover:text-primary"
                      >
                        {site.contact.phone}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-fg">{site.contact.phone}</span>
                    )}
                  </div>
                </li>

                <li className="flex items-start gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                    <Icon name="globe" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold tracking-widest2 text-muted">
                      LOCATION
                    </p>
                    <p className="text-sm font-medium text-fg">
                      {site.contact.location}
                    </p>
                  </div>
                </li>
              </ul>

              <p className="mt-7 text-[10px] font-semibold tracking-widest2 text-muted">
                FIND ME ONLINE
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {safeSocials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline text-muted transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:text-primary hover:shadow-glow-sm"
                    >
                      <Icon name={social.icon} className="h-[18px] w-[18px]" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="pt-9 text-right lg:order-2">
            <h2 className="font-display text-4xl font-extrabold tracking-tight text-fg sm:text-5xl">
              LET&apos;S BUILD
              <br />
              <span className="text-gradient-primary animate-gradient-x">
                SOMETHING USEFUL
              </span>
            </h2>
            <p className="ml-auto mt-6 max-w-lg text-base leading-relaxed text-muted">
              {site.contact.availability}
            </p>

            <div className="mt-9 flex flex-wrap justify-end gap-3">
              {mailto("Hello Saifeddine") ? (
                <KineticButton
                  href={mailto("Hello Saifeddine") ?? undefined}
                  size="lg"
                  tone="primary"
                >
                  {site.contact.email}
                  <Icon
                    name="arrowUpRight"
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </KineticButton>
              ) : null}
              <KineticButton href="#projects" size="lg" tone="secondary">
                VIEW WORK
              </KineticButton>
            </div>
          </Reveal>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 sm:flex-row">
          <p className="text-[11px] tracking-widest2 text-muted">
            © {new Date().getFullYear()} {site.name}
          </p>
          <p className="text-[11px] tracking-widest2 text-muted">
            BUILT WITH NEXT.JS · TAILWIND · FRAMER MOTION
          </p>
        </div>
      </div>
    </section>
  );
}
