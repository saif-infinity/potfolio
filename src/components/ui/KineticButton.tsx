// Provenance: native React port of the button (#btn + #btn-gl) in
// `reference/valence-core.source.html`, which is the authority.
// The fragment below is a literal transcription of that file's `FS_BTN`
// array inside `initButtonGL` (joined with '\n'), verified by diffing the
// extracted `FS_BTN` string against the extracted `FRAG` string
// character-by-character (zero differing characters in the fragment body).

"use client";

import { useEffect, useRef, type MouseEvent, type MouseEventHandler, type ReactNode, type Ref, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import styles from "./KineticButton.module.css";

export type KineticButtonSize = "sm" | "lg";
export type KineticButtonTone = "primary" | "secondary";

type KineticButtonProps = {
  href?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
  size?: KineticButtonSize;
  tone?: KineticButtonTone;
  ariaLabel?: string;
};

const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

// Literal transcription of FS_BTN from reference/valence-core.source.html.
const FRAG = [
  'precision highp float;',
  'uniform vec2 u_res;',
  'uniform float u_time;',
  'uniform float u_arcs;',
  'uniform float u_flash;',
  'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}',
  'float noise(vec2 p){',
  '  vec2 i=floor(p), f=fract(p);',
  '  vec2 u=f*f*(3.0-2.0*f);',
  '  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),',
  '             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);',
  '}',
  'float fbm(vec2 p){',
  '  float v=0.0; float a=0.5;',
  '  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.05+vec2(9.7,3.1); a*=0.5; }',
  '  return v;',
  '}',
  'float sdRBox(vec2 p, vec2 b, float r){',
  '  vec2 q = abs(p) - b + r;',
  '  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;',
  '}',
  'void main(){',
  '  vec2 p = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;',
  '  float ar = u_res.x / u_res.y;',
  '  vec2 hs = vec2(ar * 0.5 - 0.2, 0.5 - 0.2);',
  '  float d = sdRBox(p, hs, 0.14);',
  '  float t = u_time;',
  '  float hover = clamp(u_arcs / 6.0, 0.0, 1.0);',
  '  vec3 col = vec3(0.039, 0.039, 0.039);',
  '  float plate = 1.0 - smoothstep(-0.004, 0.004, d);',
  '  vec3 plateCol = vec3(0.04, 0.05, 0.055);',
  '  plateCol += vec3(0.014, 0.022, 0.035) * fbm(p * 9.0);',
  '  plateCol += vec3(0.0, 0.25, 0.3) * exp(d * 9.0) * (0.25 + hover * 0.6);',
  '  col = mix(col, plateCol, plate);',
  '  col *= 1.0 + 0.5 * exp(-max(d, 0.0) * 16.0) * (1.0 - plate);',
  '  float a = atan(p.y, p.x);',
  '  vec3 arcCol = vec3(0.0);',
  '  for (int i = 0; i < 6; i++) {',
  '    float fi = float(i);',
  '    float w = clamp(u_arcs - fi, 0.0, 1.0);',
  '    float n1 = fbm(vec2(a * 2.4 + fi * 11.3, t * (1.6 + fi * 0.27) + fi * 53.1));',
  '    float off = (n1 - 0.5) * (0.11 + u_flash * 0.1);',
  '    float seg = smoothstep(0.35, 0.75, noise(vec2(a * 1.8 + fi * 7.7, t * (0.9 + fi * 0.13) + fi * 19.0)));',
  '    seg = 0.3 + 0.7 * seg;',
  '    float g = 0.0042 / (abs(d + off) + 0.006);',
  '    arcCol += (vec3(0.0, 0.75, 0.9) * g + vec3(0.6, 1.0, 0.95) * g * g * 0.55) * w * seg;',
  '  }',
  '  float outerMask = 1.0 - smoothstep(0.04, 0.15, d);',
  '  col += arcCol * (0.6 + 0.4 * hover) * outerMask;',
  '  float ring = 0.006 / (abs(d) + 0.006);',
  '  col += vec3(0.8, 0.98, 1.0) * ring * u_flash * 1.5 * outerMask;',
  '  col += vec3(0.7, 0.95, 1.0) * u_flash * 0.16 * outerMask;',
  '  gl_FragColor = vec4(col, 1.0);',
  '}'
].join('\n');

// Authored flicker entrance from the source GSAP timeline:
// keyframes 0%/9%/15%/24%/31%/44%/100%, duration 1.15, ease none.
const FLICKER_OPACITY = [0, 0.85, 0.12, 0.92, 0.35, 1, 1];
const FLICKER_SCALE = [0.92, 1, 1, 1, 1, 1.015, 1];
const FLICKER_TIMES = [0, 0.09, 0.15, 0.24, 0.31, 0.44, 1];

function useKineticGL(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  hostRef: RefObject<HTMLElement | null>,
  onFallback: () => void,
) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: true,
      });
    } catch {
      gl = null;
    }
    if (!gl) {
      onFallback();
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl!.createShader(type)!;
      gl!.shaderSource(sh, src);
      gl!.compileShader(sh);
      if (!gl!.getShaderParameter(sh, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(sh);
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      onFallback();
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      onFallback();
      return;
    }
    gl.useProgram(prog);

    // Fullscreen triangle (source geometry).
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uArcs = gl.getUniformLocation(prog, "u_arcs");
    const uFlash = gl.getUniformLocation(prog, "u_flash");

    // ---- authored JS state (initButtonGL behaviour, verbatim) ----
    let arcs = 2.4;
    let arcsTarget = 2.4;
    let flash = 0;
    let crawl = 0;
    const reduced = reduceMotion === true;
    let last = performance.now();
    let raf = 0;
    let visible = true;
    let disposed = false;

    const resize = () => {
      if (disposed) return;
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl!.viewport(0, 0, w, h);
      }
    };
    resize();

    const frame = (now: number) => {
      if (disposed) return;
      raf = 0;
      // Offscreen buttons never schedule work — the observer below is the gate.
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      arcs += (arcsTarget - arcs) * Math.min(1, dt*5);
      flash *= Math.exp(-3.6*dt);
      crawl += dt * (0.6 + (arcs/6)*1.1 + flash*2.0);
      const t = reduced ? 3.0 : crawl;
      gl!.uniform2f(uRes, canvas.width, canvas.height);
      gl!.uniform1f(uTime, t);
      gl!.uniform1f(uArcs, arcs);
      gl!.uniform1f(uFlash, flash);
      gl!.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (disposed || raf !== 0 || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    // Pause offscreen: with ~6 live contexts on the page, only render while seen.
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        visible = entry.isIntersecting && entry.intersectionRatio > 0;
        if (visible) {
          resize();
          kick();
        } else if (raf !== 0) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: [0, 0.05, 0.5] },
    );
    io.observe(host);
    // If already on screen, the observer fires async — kick once in case.
    kick();

    const onEnter = () => {
      arcsTarget = 5.8;
    };
    const onLeave = () => {
      arcsTarget = 2.4;
    };
    const onPress = () => {
      flash = 1;
    };
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(host);
    }
    window.addEventListener("resize", resize);
    host.addEventListener("mouseenter", onEnter);
    host.addEventListener("mouseleave", onLeave);
    host.addEventListener("focus", onEnter);
    host.addEventListener("blur", onLeave);
    host.addEventListener("click", onPress);

    return () => {
      disposed = true;
      if (raf !== 0) cancelAnimationFrame(raf);
      io.disconnect();
      ro?.disconnect();
      window.removeEventListener("resize", resize);
      host.removeEventListener("mouseenter", onEnter);
      host.removeEventListener("mouseleave", onLeave);
      host.removeEventListener("focus", onEnter);
      host.removeEventListener("blur", onLeave);
      host.removeEventListener("click", onPress);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
}

export function KineticButton({
  href,
  onClick,
  children,
  className = "",
  size = "lg",
  tone = "primary",
  ariaLabel,
}: KineticButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLElement | null>(null);
  const reduceMotion = useReducedMotion();

  useKineticGL(canvasRef, hostRef, () => {
    hostRef.current?.setAttribute("data-gl-fallback", "true");
  });

  const setHost = (el: HTMLElement | null) => {
    hostRef.current = el;
  };

  const sizeClass = size === "sm" ? styles.sizeSm : styles.sizeLg;
  const toneClass = tone === "secondary" ? styles.toneGhost : styles.toneSolid;
  const cls = `${styles.btn} ${sizeClass} ${toneClass} ${className}`.trim();

  const inner = (
    <>
      <canvas ref={canvasRef} className={styles.gl} aria-hidden="true" />
      {tone === "secondary" ? (
        <span className={styles.ghostVeil} aria-hidden="true" />
      ) : null}
      <span className={styles.label}>{children}</span>
    </>
  );

  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 } }
    : {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: FLICKER_OPACITY, scale: FLICKER_SCALE },
        transition: { duration: 1.15, times: FLICKER_TIMES, ease: "linear" as const },
      };

  if (href !== undefined) {
    return (
      <motion.a
        ref={setHost as unknown as Ref<HTMLAnchorElement>}
        href={href}
        aria-label={ariaLabel}
        onClick={onClick as unknown as MouseEventHandler<HTMLAnchorElement>}
        className={cls}
        {...motionProps}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={setHost as unknown as Ref<HTMLButtonElement>}
      type="button"
      aria-label={ariaLabel}
      onClick={onClick as unknown as MouseEventHandler<HTMLButtonElement>}
      className={cls}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
}
