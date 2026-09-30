/**
 * Shared 3D stage for the four certificate cards.
 *
 * ONE WebGLRenderer on ONE fixed canvas; each card owns its Scene,
 * PerspectiveCamera, paper mesh and certificate texture, rendered into a
 * scissored viewport (source interaction/physics/shader code runs per card,
 * 1:1). Drag handlers attach to the CARD ELEMENTS (the canvas is
 * pointer-events:none).
 *
 * Frame recipe per card (WebGL origin is bottom-left, CSS top-left):
 *   clear ONCE at frame start (scissor test off), then per visible card:
 *   setViewport / setScissor / clearDepth / render.
 * clearDepth per card is critical: without it depth bleeds between cards.
 */

import * as T from "three";
import {
  CFG,
  CARD_SEG_X,
  CARD_SEG_Y,
  CARD_TEX_W,
  CARD_TEX_H,
  buildSheet,
  getFaces,
  makeEnv,
  paintCertificate,
  toPaperData,
  type BuiltSheet,
} from "./paperArt";
import type { Certificate } from "@/data/site";

export type CardSlot = {
  el: HTMLElement;
  cert: Certificate;
};

type CardState = {
  el: HTMLElement;
  index: number;
  scene: T.Scene;
  camera: T.PerspectiveCamera;
  sheet: BuiltSheet;
  tex: T.CanvasTexture;
  key: T.DirectionalLight;
  rim: T.DirectionalLight;
  amb: T.AmbientLight;
  // --- source §5 interaction state, per card ---
  t0: { x: number };
  displayRot: number;
  rotV: number;
  dragging: boolean;
  lx: number;
  lastMove: number;
  light: { x: number; y: number; tx: number; ty: number };
  phase: number;
  dir: number;
  lastW: number;
  lastH: number;
  cleanup: () => void;
};

export function initCertStage(
  canvas: HTMLCanvasElement,
  section: HTMLElement,
  slots: CardSlot[],
): { setActive: (index: number) => void; destroy: () => void } {
  let disposed = false;
  let raf = 0;
  let running = false;
  const cards: CardState[] = [];
  // Which card is on the press. This is wiring, not rendering: it only
  // decides which card gets drawn. Read fresh in tick() so a setActive()
  // call issued before the async boot resolves still applies.
  let activeIndex = 0;

  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  // PORT-NOTES: DPR capped at 1.5 (not the source's 2) — four viewports.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  // PORT r149 -> 0.186 (modern default; stated explicitly for clarity)
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.autoClear = false;
  renderer.setScissorTest(true);

  // Shared across all four cards: one PMREM pass, one env texture.
  const pmrem = new T.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envTex = makeEnv();
  const envRT = pmrem.fromEquirectangular(envTex);

  const clock = new T.Clock();

  const sizeRenderer = () => {
    if (disposed) return;
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  };
  sizeRenderer();
  window.addEventListener("resize", sizeRenderer);

  /* ---------------- per-card interaction (source §5, per card) ---------------- */

  const attachCard = (slot: CardSlot, sheet: BuiltSheet, index: number): CardState => {
    const { el } = slot;
    const st: CardState = {
      el,
      index,
      scene: new T.Scene(),
      camera: new T.PerspectiveCamera(32, 1, 0.1, 100),
      sheet,
      tex: sheet.mesh.material.map as T.CanvasTexture,
      key: new T.DirectionalLight(0xfff2d8, 1.05),
      rim: new T.DirectionalLight(0x8ea2ff, 0.35),
      amb: new T.AmbientLight(0xffffff, 0.25),
      t0: { x: 0 },
      displayRot: 0,
      rotV: 0,
      dragging: false,
      lx: 0,
      lastMove: 0,
      light: { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 },
      phase: index * 1.7,
      dir: index % 2 === 0 ? 1 : -1,
      lastW: 0,
      lastH: 0,
      cleanup: () => {},
    };
    st.key.position.set(2.2, 3.0, 2.4);
    st.scene.add(st.key);
    st.rim.position.set(-2.4, -1.2, 1.6);
    st.scene.add(st.rim);
    st.scene.add(st.amb);
    st.scene.environment = envRT.texture;
    st.scene.add(st.sheet.mesh);
    st.camera.position.set(0, 0, CFG.camZ);

    const onDown = (e: PointerEvent) => {
      st.dragging = true;
      st.lx = e.clientX;
      st.lastMove = performance.now();
      el.classList.add("cert-grabbing");
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        /* no capture — drag still tracks via move events */
      }
      st.rotV = 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      st.light.tx = (e.clientX - r.left) / r.width;
      st.light.ty = 1 - (e.clientY - r.top) / r.height;
      if (!st.dragging) return;
      const dx = e.clientX - st.lx;
      st.lx = e.clientX;
      const now = performance.now();
      const dt = Math.max(now - st.lastMove, 1);
      st.lastMove = now;
      const delta = (dx / r.width) * CFG.turnSpeed;
      st.displayRot += delta;
      st.rotV = (delta / dt) * 16;
    };
    const onUp = (e: PointerEvent) => {
      if (!st.dragging) return;
      st.dragging = false;
      el.classList.remove("cert-grabbing");
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        /* already released */
      }
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    st.cleanup = () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.classList.remove("cert-grabbing");
    };
    return st;
  };

  /* ---------------- scroll response ---------------- */

  const reduced = () =>
    CFG.reduced ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const scrollTurnFor = (sr: DOMRect, vh: number, dir: number): number => {
    if (vh < 1) return 0;
    const c = (sr.top + sr.height / 2 - vh / 2) / (vh / 2 + sr.height / 2);
    const clamped = Math.max(-1, Math.min(1, c));
    return -clamped * 0.7 * dir;
  };

  /* ---------------- frame loop ---------------- */

  const tick = () => {
    if (disposed || !running) return;
    raf = requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const vh = window.innerHeight;
    const sr = section.getBoundingClientRect();
    const t = clock.elapsedTime;
    const rm = reduced();

    // clear ONCE (scissor test off so the whole canvas clears)
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);

    for (const st of cards) {
      // Only the selected card is drawn. All four slots share one rect
      // (they are stacked in the same press), so drawing them all would
      // paint them on top of each other.
      if (st.index !== activeIndex) continue;
      const r = st.el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40 || r.width < 2 || r.height < 2) {
        continue; // off-screen: 4 renders/frame is not free
      }
      if (r.width !== st.lastW || r.height !== st.lastH) {
        st.lastW = r.width;
        st.lastH = r.height;
        st.camera.aspect = r.width / r.height;
        // frame the sheet (source §6 layout math, per-card aspect)
        const sheetH = 2.9;
        const sheetW = 2.1;
        const vfov = (st.camera.fov * Math.PI) / 180;
        const distH = sheetH * 1.24 / (2 * Math.tan(vfov / 2));
        const hfov = 2 * Math.atan(Math.tan(vfov / 2) * st.camera.aspect);
        const distW = sheetW * 1.18 / (2 * Math.tan(hfov / 2));
        st.camera.position.z = Math.max(distH, distW);
        st.camera.updateProjectionMatrix();
      }

      // --- throw physics + detent settling (source §6, verbatim) ---
      if (!st.dragging) {
        if (Math.abs(st.rotV) > 0.0004) {
          st.displayRot += st.rotV * dt;
          st.rotV *= 0.94;
          st.t0.x = st.displayRot;
        } else {
          const detent =
            Math.round(st.displayRot / (Math.PI / 2)) * (Math.PI / 2);
          st.displayRot += (detent - st.displayRot) * Math.min(dt * 7, 1);
          st.t0.x = st.displayRot;
        }
      }
      const g = CFG.reduced ? 1 : Math.min(dt * 9, 1);
      st.displayRot += (st.t0.x - st.displayRot) * (st.dragging ? 1 : g);

      // --- vertex bend + fold (source §6, verbatim at card tessellation) ---
      const mesh = st.sheet.mesh;
      const pos = mesh.geometry.attributes.position as T.BufferAttribute;
      const base = st.sheet.base;
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3];
        const by = base[i * 3 + 1];
        const edge = Math.max(0, Math.abs(bx) - 0.55) / 0.5;
        const fold = Math.sin(by * CFG.pull * 3.1) * CFG.fold * (0.25 + edge);
        pos.array[i * 3 + 2] =
          base[i * 3 + 2] +
          fold +
          Math.sin(bx * 2.2 + by * 1.4) * CFG.bend * edge;
      }
      pos.needsUpdate = true;
      mesh.geometry.computeVertexNormals();

      // scroll drift + idle sway (skipped under reduced motion; drag still works)
      const scrollTurn = rm ? 0 : scrollTurnFor(sr, vh, st.dir);
      const sway = rm ? 0 : Math.sin(t * 0.45 + st.phase) * 0.05;
      mesh.rotation.y = st.displayRot + scrollTurn + sway;
      mesh.rotation.x = CFG.tilt + Math.sin(st.displayRot * 0.5) * 0.03;
      mesh.position.x = Math.sin(st.displayRot) * CFG.pull * 0.08;

      st.light.x += (st.light.tx - st.light.x) * Math.min(dt * 6, 1);
      st.light.y += (st.light.ty - st.light.y) * Math.min(dt * 6, 1);
      const mat = mesh.material as T.MeshPhysicalMaterial;
      (mat.userData.light as T.Vector2 | undefined)?.set(
        st.light.x,
        st.light.y,
      );

      const vx = r.left;
      const vy = vh - r.bottom;
      renderer.setViewport(vx, vy, r.width, r.height);
      renderer.setScissor(vx, vy, r.width, r.height);
      renderer.clearDepth();
      renderer.render(st.scene, st.camera);
    }
  };

  const start = () => {
    if (disposed || running) return;
    running = true;
    clock.getDelta();
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Gate the whole RAF on section visibility (and hide the fixed canvas).
  const io = new IntersectionObserver(
    (entries) => {
      const vis = entries.some((e) => e.isIntersecting);
      canvas.style.display = vis ? "" : "none";
      if (vis) start();
      else stop();
    },
    { rootMargin: "120px" },
  );
  io.observe(section);

  /* ---------------- boot: font gate, then paint all four ---------------- */

  let booted = false;
  (async () => {
    try {
      const faces = await getFaces();
      if (disposed) return;
      const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      const painted = await Promise.all(
        slots.map(async (slot, i) => {
          const { canvas: texCanvas, images } = paintCertificate(
            toPaperData(slot.cert),
            faces,
            CARD_TEX_W,
            CARD_TEX_H,
          );
          await Promise.all(images.map((o) => o.img.decode().catch(() => {})));
          if (disposed) return null;
          const tx = texCanvas.getContext("2d")!;
          for (const o of images) tx.drawImage(o.img, o.cx, o.cy, o.w, o.h);
          const tex = new T.CanvasTexture(texCanvas);
          // PORT r149 -> 0.186
          tex.colorSpace = T.SRGBColorSpace;
          tex.anisotropy = maxAniso;
          tex.needsUpdate = true;
          const sheet = buildSheet(tex, CARD_SEG_X, CARD_SEG_Y);
          return attachCard(slot, sheet, i);
        }),
      );
      if (disposed) {
        for (const st of painted) {
          if (!st) continue;
          st.cleanup();
          st.sheet.mesh.geometry.dispose();
          (st.sheet.mesh.material as T.Material).dispose();
          st.tex.dispose();
        }
        return;
      }
      for (const st of painted) {
        if (st) cards.push(st);
      }
      booted = true;
      // If the section is already on screen, the observer may have fired
      // before cards existed — kick the loop.
      const r = section.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        canvas.style.display = "";
        start();
      }
    } catch {
      // WebGL or paint failure: hide the canvas, the cards still read as text.
      canvas.style.display = "none";
    }
  })();

  /* ---------------- cleanup ---------------- */

  const rmq =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const onRM = (e: MediaQueryListEvent) => {
    CFG.reduced = e.matches;
  };
  CFG.reduced = rmq?.matches ?? false;
  rmq?.addEventListener?.("change", onRM);

  return {
    setActive(index: number) {
      if (!Number.isInteger(index)) return;
      // Clamp against slots.length, not cards.length: the caller may select
      // before the async boot has pushed the cards.
      activeIndex = Math.min(Math.max(index, 0), Math.max(slots.length - 1, 0));
    },
    destroy() {
      disposed = true;
      stop();
      io.disconnect();
      window.removeEventListener("resize", sizeRenderer);
      rmq?.removeEventListener?.("change", onRM);
      for (const st of cards) {
        st.cleanup();
        st.sheet.mesh.geometry.dispose();
        (st.sheet.mesh.material as T.Material).dispose();
        st.tex.dispose();
        st.scene.remove(st.sheet.mesh);
        st.scene.environment = null;
      }
      cards.length = 0;
      envRT.dispose();
      pmrem.dispose();
      envTex.dispose();
      renderer.dispose();
      void booted;
    },
  };
}
