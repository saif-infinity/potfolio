import Link from "next/link";
import { CrtBackground } from "@/components/crt/CrtBackground";
import { OpenerAutoAdvance } from "@/components/crt/OpenerAutoAdvance";
import { Icon } from "@/components/icons";

/**
 * Terminal splash — the standalone first page at `/`.
 *
 * Full viewport with no scroll; it hands off to `/home` via
 * OpenerAutoAdvance after a fixed delay. The component owns the
 * reduced-motion freeze, WebGL fallback, off-screen pausing and context
 * recovery; this section only stages it and offers the manual entry cue.
 */
export function TerminalOpener() {
  return (
    <section aria-label="Terminal introduction" className="crt-opener">
      <OpenerAutoAdvance />
      <CrtBackground
        variant="terminal"
        speed={1}
        typeSpeed={1}
        motion={1}
        brightness={1}
        opacity={1}
        className="absolute inset-0"
      />
      {/* Top scrim: softens the boot log where it burns brightest. */}
      <div
        aria-hidden="true"
        className="crt-scrim-top pointer-events-none absolute inset-x-0 top-0 h-28"
      />
      {/* Bottom melt: the canvas is opaque, so this dissolves its edge into
          the near-black rather than leaving a hard cut. */}
      <div
        aria-hidden="true"
        className="crt-melt pointer-events-none absolute inset-x-0 bottom-0"
      />
      {/* Manual entry cue — the direct route to the portfolio for anyone
          who doesn't wait for (or misses) the timed handoff. */}
      <Link
        href="/home"
        aria-label="Enter the portfolio"
        className="crt-cue absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 text-[10px] font-semibold tracking-widest2 text-muted transition-colors hover:text-primary"
      >
        ENTER
        <Icon name="arrowUpRight" className="h-4 w-4 animate-scroll-hint" />
      </Link>
    </section>
  );
}
