"use client";

import { useEffect, useRef } from "react";
import styles from "./ParticleField.module.css";

type ParticleNode = { x: number; y: number; vy: number; char: string };
type Beam = { x: number; y: number; length: number; speed: number; opacity: number };

export type ParticleFieldProps = {
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

export function ParticleField({ className = "", "aria-hidden": ariaHidden = true }: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return undefined;
    const context = el.getContext("2d");
    if (!context) return undefined;
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    let width = 0;
    let height = 0;
    let nodes: ParticleNode[] = [];
    let beams: Beam[] = [];
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()'.split('');
    const mouse = { x: -1000, y: -1000 };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduceMotion = motionQuery.matches;

    const stop = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };

    const start = () => {
      if (!rafRef.current && !reduceMotion && !document.hidden) {
        rafRef.current = requestAnimationFrame(draw);
      }
    };

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initParticles() {
      nodes = Array.from({ length: 90 }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vy: (Math.random() * 0.4) + 0.1,
        char: chars[Math.floor(Math.random() * chars.length)]
      }));

      beams = Array.from({ length: 25 }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 100 + 50,
        speed: (Math.random() * 6) + 3,
        opacity: Math.random() * 0.5 + 0.3
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      beams.forEach(b => {
        b.y -= b.speed;
        if (b.y + b.length < 0) {
          b.y = height + 100;
          b.x = Math.random() * width;
        }
        const g = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
        g.addColorStop(0, `rgba(0, 255, 65, ${b.opacity})`);
        g.addColorStop(1, 'transparent');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x, b.y + b.length);
        ctx.stroke();
      });

      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const d = Math.hypot(n1.x - n2.x, n1.y - n2.y);
          if (d < 120) {
            ctx.strokeStyle = `rgba(74, 222, 128, ${0.15 * (1 - d / 120)})`;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        n.y += n.vy;
        if (n.y > height + 20) {
          n.y = -20;
          n.x = Math.random() * width;
        }

        const dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);

        if (dist < 180 || Math.random() > 0.98) n.char = chars[Math.floor(Math.random() * chars.length)];

        if (dist < 180) {
          ctx.strokeStyle = `rgba(0, 255, 65, ${0.5 * (1 - dist / 180)})`;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }

        ctx.fillStyle = dist < 180 ? '#00FF41' : 'rgba(74, 222, 128, 0.4)';
        ctx.fillText(n.char, n.x, n.y);
      });

      rafRef.current = 0;
      if (!reduceMotion && !document.hidden) rafRef.current = requestAnimationFrame(draw);
    }

    const onResize = () => {
      resize();
      initParticles();
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const onMotionChange = () => {
      reduceMotion = motionQuery.matches;
      if (reduceMotion) {
        stop();
        draw();
      } else {
        start();
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("visibilitychange", onVisibility);
    if (typeof motionQuery.addEventListener === "function") {
      motionQuery.addEventListener("change", onMotionChange);
    } else {
      motionQuery.addListener(onMotionChange);
    }

    resize();
    initParticles();
    if (reduceMotion) draw();
    else start();

    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
      if (typeof motionQuery.removeEventListener === "function") {
        motionQuery.removeEventListener("change", onMotionChange);
      } else {
        motionQuery.removeListener(onMotionChange);
      }
    };
  }, []);

  return (
    <div aria-hidden={ariaHidden} className={`${styles.host}${className ? ` ${className}` : ""}`}>
      <canvas ref={canvasRef} />
    </div>
  );
}
