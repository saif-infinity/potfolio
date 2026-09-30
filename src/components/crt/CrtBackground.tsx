"use client";

import { useEffect, useRef } from "react";
import {
  createCrtRenderer,
  crtStyle,
  CRT_DEFAULTS,
  CRT_VARIANTS,
  type CrtOptions,
} from "./crtRenderer";
import type { CrtVariant } from "./crtScreens";

export { CRT_VARIANTS };
export type { CrtVariant };

export type CrtBackgroundProps = Partial<CrtOptions> & {
  className?: string;
  /**
   * Decorative layer — hidden from assistive tech by default. Overridable only
   * if a future caller wraps it in something meaningful.
   */
  "aria-hidden"?: boolean | "true" | "false";
};

/**
 * Frames painted before freezing under `prefers-reduced-motion`. The boot log
 * types at ~4.4 chars/frame, so this is comfortably past the ~136 frames it
 * needs to settle on a complete screen.
 */
const REDUCED_MOTION_FRAMES = 240;

/**
 * Decorative CRT tube: a WebGL composite over an offscreen Canvas 2D screen.
 *
 * The renderer draws the picture; the `.threeui-background` rules in
 * `globals.css` own placement, blending and edge fading. The class contract
 * below is what that CSS keys off, so it must stay stable.
 *
 * Brightness, opacity and the hue/saturation grade are applied here on the
 * finished host — never by editing the texture or the GLSL.
 */
export function CrtBackground({
  className = "",
  "aria-hidden": ariaHidden = true,
  ...props
}: CrtBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Merged props, recomputed each render so the inline style below always
  // reflects current props. The renderer additionally reads this through a
  // ref, so live prop changes reach the canvas without remounting.
  const options: CrtOptions = { ...CRT_DEFAULTS, ...props };
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      reduceMotion = motionQuery.matches;
    };
    let reduceMotion = motionQuery.matches;
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionChange);
    } else {
      motionQuery.addListener(onMotionChange);
    }

    let renderer: ReturnType<typeof createCrtRenderer>;
    try {
      renderer = createCrtRenderer(host, canvas, () => optionsRef.current);
    } catch {
      // No WebGL on this device. The layer is purely decorative, so fall back
      // to the tube's own base colour rather than taking the page down.
      host.style.background = crtStyle(optionsRef.current.variant).background;
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", onMotionChange);
      } else {
        motionQuery.removeListener(onMotionChange);
      }
      return undefined;
    }

    let frame = 0;
    let visible = true;
    let contextLost = false;
    let framesDrawn = 0;

    const stop = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const tick = (now: number) => {
      if (contextLost) {
        frame = 0;
        return;
      }
      renderer.render(now);
      framesDrawn += 1;
      // Reduced motion: settle on one complete frame, then stop for good.
      if (reduceMotion && framesDrawn >= REDUCED_MOTION_FRAMES) {
        frame = 0;
        return;
      }
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };

    const start = () => {
      if (!frame && !contextLost) frame = requestAnimationFrame(tick);
    };

    const resize = () => {
      renderer.resize();
      renderer.render(performance.now());
    };

    const onLost = (event: Event) => {
      // Preventing the default is what makes a restore possible at all.
      event.preventDefault();
      contextLost = true;
      stop();
    };

    const onRestored = () => {
      contextLost = false;
      framesDrawn = 0;
      try {
        // Every GL object died with the context, so build a fresh renderer
        // rather than trying to reuse handles that no longer exist.
        renderer.dispose();
        renderer = createCrtRenderer(host, canvas, () => optionsRef.current);
        resize();
      } catch {
        contextLost = true;
        return;
      }
      start();
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });

    resizeObserver.observe(host);
    intersection.observe(host);
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    resize();
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersection.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", onMotionChange);
      } else {
        motionQuery.removeListener(onMotionChange);
      }
      renderer.dispose();
    };
  }, []);

  const style = crtStyle(options.variant);

  return (
    <div
      ref={hostRef}
      aria-hidden={ariaHidden}
      className={`threeui-background crt crt-${options.variant}${
        className ? ` ${className}` : ""
      }`}
      style={{
        background: style.background,
        opacity: options.opacity,
        filter: `hue-rotate(${options.hue}deg) saturate(${options.saturation}) brightness(${options.brightness})`,
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
