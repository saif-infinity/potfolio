import { MotionConfig } from "framer-motion";
import { Navbar } from "@/components/navigation/Navbar";
import { ParticleField } from "@/components/background/ParticleField";
import { HeroSection } from "@/components/hero/HeroSection";
import { WhatIDoSection } from "@/components/sections/WhatIDoSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { AwardsSection } from "@/components/sections/AwardsSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { EducationSection } from "@/components/sections/EducationSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ContactSection } from "@/components/sections/ContactSection";

export default function HomePage() {
  return (
    <>
      <ParticleField />
      <Navbar />
      {/* Instant (not animated) framer reveals when the OS asks for reduced
          motion; the CSS kill-switch in globals.css covers the rest. */}
      <MotionConfig reducedMotion="user">
        <div className="relative z-10 mx-auto w-full max-w-[1440px] px-4 pb-4 pt-24 md:px-12 md:pb-12 md:pt-28">
          <div
            className="rounded-[24px] p-px"
            style={{
              background:
                "linear-gradient(to right bottom, rgba(255,255,255,0.2), rgba(255,255,255,0.03), rgba(0,0,0,0))",
            }}
          >
            <div
              className="relative overflow-hidden rounded-[23px] bg-bg/70"
              style={{ boxShadow: "rgba(255,255,255,0.02) 0 0 40px 0 inset" }}
            >
              <div aria-hidden="true" className="pointer-events-none absolute left-6 top-6 z-20 h-3 w-3 border-l border-t border-white/20" />
              <div aria-hidden="true" className="pointer-events-none absolute right-6 top-6 z-20 h-3 w-3 border-r border-t border-white/20" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-6 left-6 z-20 h-3 w-3 border-b border-l border-white/20" />
              <div aria-hidden="true" className="pointer-events-none absolute bottom-6 right-6 z-20 h-3 w-3 border-b border-r border-white/20" />
              <main className="relative">
                <HeroSection />
                <WhatIDoSection />
                <ProjectsSection />
                <AwardsSection />
                <SkillsSection />
                <EducationSection />
                <ExperienceSection />
                <ContactSection />
              </main>
            </div>
          </div>
        </div>
      </MotionConfig>
    </>
  );
}
