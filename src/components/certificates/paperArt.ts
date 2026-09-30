/**
 * 3D-paper artwork port — faithful carry-over of the standalone
 * `reference/certificate-3d-paper.source.html` authored <script type="module">.
 *
 * Sections mirror the source: §0 config, §1 env map, §2 parchment texture,
 * §3 sheet geometry. The renderer/scene/loop live in certStage.ts.
 *
 * Deliberate deviations from the source (all recorded in
 * reference/PORT-NOTES.md):
 *  - r149 -> 0.186 colour API (outputColorSpace / colorSpace).
 *  - texture resolution is a parameter (cards render ~800x1104, not 1400x1932).
 *  - letter-spacing values scale with the texture scale factor S.
 *  - CERT placeholder identity is replaced by real Certificate data:
 *      signatures -> focus chips, wax "O" -> issuer initial,
 *      credential-ID footer line -> small ornament (no ID exists).
 *  - onBeforeCompile wires `mat.userData.light` (the authored per-frame
 *    update line referenced it, but nothing ever assigned it).
 */

import * as T from "three";
import type { Certificate } from "@/data/site";

/* ---------------- source §0 — config ---------------- */

export const CFG = {
  W: 1200,
  H: 1656, // authoring grid of the certificate texture
  tilt: -0.12,
  turnSpeed: 2.2,
  pull: 0.55,
  bend: 0.05,
  fold: 0.085,
  camZ: 4.6,
  reduced: false,
};

/** Source tessellation: 72x96 (~7k verts). Kept for reference only. */
export const SOURCE_SEG_X = 72;
export const SOURCE_SEG_Y = 96;

/**
 * Card tessellation. At ~300x400 CSS px the fine grid is invisible, and four
 * source-density sheets would be ~28k vertex writes + 4 normal recomputes per
 * frame. See PORT-NOTES.md.
 */
export const CARD_SEG_X = 24;
export const CARD_SEG_Y = 32;

/** Card texture resolution (~card device pixels at DPR 1.5). See PORT-NOTES. */
export const CARD_TEX_W = 800;
export const CARD_TEX_H = 1104;

/* ---------------- paper data (real content only) ---------------- */

export type PaperData = {
  org: string; // issuer, e.g. "CISCO"
  sub: string; // fullTitle, e.g. "Cisco CCNA 1 — Introduction to Networks"
  name: string; // title, the large line, e.g. "CCNA 1"
  meta: string; // blurb
  dateLine: string; // footer line, e.g. "AWARDED · 2025" or "COURSE COMPLETED"
  /**
   * The year, when the owner has actually confirmed one. Absent for CCNA 1,
   * AWS Cloud Foundations and Introduction to Cybersecurity — the CV dates
   * none of them. When absent the big footer line is dropped and the
   * ornament closes the gap, so the face never implies a date it cannot back.
   */
  year?: string;
  chips: string[]; // focus skill chips (3-4)
  sealLetter: string; // issuer initial — a derivation, not a signatory
};

export function toPaperData(c: Certificate): PaperData {
  const issuer = c.issuer.trim();
  const initial = issuer.match(/[A-Za-z0-9]/)?.[0] ?? "•";
  return {
    org: issuer,
    sub: c.fullTitle,
    name: c.title,
    meta: c.blurb,
    // "AWARDED" only ever goes on parchment that carries a confirmed year —
    // currently the CTF, the one attested result. Everything else is a course
    // the owner attended, and the CV gives no date for it.
    dateLine: c.year ? `AWARDED · ${c.year}` : "COURSE COMPLETED",
    year: c.year,
    chips: [...c.focus],
    sealLetter: initial.toUpperCase(),
  };
}

/* ---------------- font gate ---------------- */

export type PaperFaces = {
  garamond: string;
  inter: string;
  serif: (sizePx: number, weight: string) => string;
  sans: (sizePx: number, weight: string) => string;
};

/**
 * Resolve the next/font-hashed family names at runtime. The sibling agent's
 * src/lib/fonts.ts registers `--font-eb-garamond` / `--font-inter-tight` on
 * <html>; the literal strings 'EB Garamond' / 'Inter Tight' will NOT resolve,
 * so the raw var value (the full generated stack) is used verbatim, with the
 * source literals kept as fallback.
 */
export function resolveFaces(): PaperFaces {
  let g = "";
  let t = "";
  try {
    const cs = getComputedStyle(document.documentElement);
    g = cs.getPropertyValue("--font-eb-garamond").trim();
    t = cs.getPropertyValue("--font-inter-tight").trim();
  } catch {
    /* non-DOM or locked-down environment: fall through to literals */
  }
  const garamond = g || "'EB Garamond'";
  const inter = t || "'Inter Tight'";
  return {
    garamond,
    inter,
    serif: (sizePx, weight) =>
      `${weight} ${sizePx}px ${garamond}, 'EB Garamond', Georgia, serif`,
    sans: (sizePx, weight) =>
      `${weight} ${sizePx}px ${inter}, 'Inter Tight', Inter, sans-serif`,
  };
}

let facesPromise: Promise<PaperFaces> | null = null;

/**
 * Load-bearing gate (source §10 boot): the certificate text is rasterised
 * into a canvas texture, so drawing before the faces are ready permanently
 * bakes the wrong typeface. Same weight/style set as the source; settled
 * individually so one missing variant can never block the rest. Shared by
 * all four cards — resolved once.
 */
export function getFaces(): Promise<PaperFaces> {
  if (!facesPromise) {
    facesPromise = (async () => {
      const f = resolveFaces();
      const specs = [
        `400 16px ${f.garamond}`,
        `500 16px ${f.garamond}`,
        `italic 400 16px ${f.garamond}`,
        `600 16px ${f.inter}`,
        `italic 500 16px ${f.inter}`,
      ];
      await Promise.allSettled(specs.map((s) => document.fonts.load(s)));
      try {
        await document.fonts.ready;
      } catch {
        /* fall through with system faces */
      }
      return f;
    })();
  }
  return facesPromise;
}

/* ---------------- source §1 — env map ---------------- */

export function makeEnv(): T.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d")!;

  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0.0, "#1b1d2c");
  g.addColorStop(0.42, "#3a3d54");
  g.addColorStop(0.52, "#555870");
  g.addColorStop(0.75, "#22222c");
  g.addColorStop(1.0, "#0a0a0e");
  x.fillStyle = g;
  x.fillRect(0, 0, 1024, 512);

  // soft studio lights
  const blob = (
    cx: number,
    cy: number,
    r: number,
    col: string,
    a: number,
  ) => {
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, col);
    rg.addColorStop(1, "rgba(0,0,0,0)");
    x.globalAlpha = a;
    x.fillStyle = rg;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
    x.globalAlpha = 1;
  };
  blob(220, 150, 260, "#ffffff", 0.95);
  blob(800, 120, 300, "#fff6e2", 0.6);
  blob(520, 330, 340, "#8f8fa8", 0.3);
  blob(940, 400, 180, "#ffe9c4", 0.35);

  const t = new T.CanvasTexture(c);
  t.mapping = T.EquirectangularReflectionMapping;
  // PORT r149 -> 0.186: implicitly LINEAR under r149; stated explicitly so the
  // lighting response matches the original exactly.
  t.colorSpace = T.LinearSRGBColorSpace;
  return t;
}

/* ---------------- source §2 — parchment texture ---------------- */

export type OrnamentImage = {
  img: HTMLImageElement;
  cx: number;
  cy: number;
  w: number;
  h: number;
};

type Ctx2D = CanvasRenderingContext2D & { letterSpacing?: string };

export function paintCertificate(
  data: PaperData,
  faces: PaperFaces,
  texW = CARD_TEX_W,
  texH = CARD_TEX_H,
): { canvas: HTMLCanvasElement; images: OrnamentImage[] } {
  const c = document.createElement("canvas");
  c.width = texW;
  c.height = texH;
  const x = c.getContext("2d") as Ctx2D | null;
  if (!x) throw new Error("2d canvas context unavailable");

  // parchment base (stops verbatim)
  const g = x.createLinearGradient(0, 0, texW, texH);
  g.addColorStop(0.0, "#f7f0e2");
  g.addColorStop(0.35, "#f0e6d2");
  g.addColorStop(0.7, "#e9dcc3");
  g.addColorStop(1.0, "#e2d2b4");
  x.fillStyle = g;
  x.fillRect(0, 0, texW, texH);

  // age blotches (counts density-scaled to the output resolution)
  const density = (texW * texH) / (1400 * 1932);
  const blotches = Math.round(130 * density);
  for (let i = 0; i < blotches; i++) {
    const cx = Math.random() * texW;
    const cy = Math.random() * texH;
    const r = 30 + Math.random() * 190 * Math.min(texW / 1400 + 0.5, 1);
    const rg = x.createRadialGradient(cx, cy, 0, cx, cy, r);
    const dark = Math.random() > 0.5;
    rg.addColorStop(
      0,
      dark ? "rgba(150,116,72,0.055)" : "rgba(255,250,238,0.06)",
    );
    rg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = rg;
    x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  // paper fibre
  const fibres = Math.round(2600 * density);
  for (let i = 0; i < fibres; i++) {
    const a = Math.random() * 0.05;
    x.fillStyle =
      Math.random() > 0.5
        ? `rgba(255,255,255,${a})`
        : `rgba(120,95,60,${a})`;
    const w = 4 + Math.random() * 20;
    x.fillRect(Math.random() * texW, Math.random() * texH, w, 1);
  }

  // ---- frame ----
  const S = texW / CFG.W; // scale factor (authoring grid -> device px)
  const px = (v: number) => v * S;
  const toGrid = (d: number) => d / S;
  const ink = "#2b2118";
  const gold = "#8a6a34";
  // letter-spacing scales with S so proportions match the source at any output size
  const ls = (v: number) => `${(v * S).toFixed(2)}px`;
  const setLS = (v: string) => {
    try {
      x.letterSpacing = v;
    } catch {
      /* pre-Chromium-99 canvas: tracking is ignored, layout still holds */
    }
  };

  const rule = (inset: number, w: number, col: string) => {
    x.strokeStyle = col;
    x.lineWidth = px(w);
    x.strokeRect(
      px(inset),
      px(inset),
      texW - px(inset * 2),
      texH - px(inset * 2),
    );
  };
  rule(58, 2.5, ink);
  rule(70, 1, gold);
  rule(84, 0.6, "rgba(43,33,24,0.5)");

  // corner flourishes (verbatim)
  const flourish = (fx: number, fy: number, sx: number, sy: number) => {
    x.save();
    x.translate(px(fx), px(fy));
    x.scale(sx, sy);
    x.strokeStyle = gold;
    x.lineWidth = px(1.6);
    x.beginPath();
    x.moveTo(0, px(30));
    x.bezierCurveTo(px(6), px(12), px(18), px(4), px(34), px(0));
    x.stroke();
    x.beginPath();
    x.moveTo(px(10), px(34));
    x.bezierCurveTo(px(20), px(22), px(28), px(24), px(34), px(30));
    x.stroke();
    x.beginPath();
    x.arc(px(34), px(30), px(2.4), 0, Math.PI * 2);
    x.fillStyle = gold;
    x.fill();
    x.restore();
  };
  flourish(84, 84, 1, 1);
  flourish(CFG.W - 84, 84, -1, 1);
  flourish(84, CFG.H - 84, 1, -1);
  flourish(CFG.W - 84, CFG.H - 84, -1, -1);

  // ---- ornaments (SVG artwork verbatim) ----
  const laurel = (cx: number, cy: number, w: number, h: number) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 140">
      <g fill="none" stroke="#8a6a34" stroke-width="2.4" stroke-linecap="round">
        <path d="M18 128 C 40 96, 66 74, 100 62 C 134 74, 160 96, 182 128"/>
        <path d="M34 120 C 54 96, 76 80, 100 72 C 124 80, 146 96, 166 120" stroke-width="1.2" opacity="0.6"/>
        <path d="M52 106 C 60 92, 70 84, 82 78"/>
        <path d="M148 106 C 140 92, 130 84, 118 78"/>
      </g>
      <g fill="#8a6a34">
        <ellipse cx="70" cy="86" rx="9" ry="4.4" transform="rotate(-32 70 86)"/>
        <ellipse cx="92" cy="76" rx="9" ry="4.4" transform="rotate(-16 92 76)"/>
        <ellipse cx="130" cy="86" rx="9" ry="4.4" transform="rotate(32 130 86)"/>
        <ellipse cx="108" cy="76" rx="9" ry="4.4" transform="rotate(16 108 76)"/>
        <circle cx="100" cy="60" r="4.6"/>
        <path d="M100 52 l3.2 5.6 6 .8 -4.4 4.2 1.1 6 -5.9-3 -5.9 3 1.1-6 -4.4-4.2 6-.8z" opacity="0.85"/>
      </g>
    </svg>`;
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    return { img, cx: px(cx - w / 2), cy: px(cy - h / 2), w: px(w), h: px(h) };
  };

  const mark = (cx: number, cy: number, size: number) => {
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#8a6a34" stroke-width="2"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#8a6a34" stroke-width="0.8" opacity="0.7"/>
      <g stroke="#8a6a34" stroke-width="2.4" fill="none" stroke-linecap="round">
        <path d="M50 20 L50 80"/>
        <path d="M30 34 C 42 40, 58 40, 70 34"/>
        <path d="M28 50 C 42 56, 58 56, 72 50"/>
        <path d="M30 66 C 42 72, 58 72, 70 66"/>
      </g>
    </svg>`;
    const img = new Image();
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
    return {
      img,
      cx: px(cx - size / 2),
      cy: px(cy - size / 2),
      w: px(size),
      h: px(size),
    };
  };

  const images = [laurel(600, 1160, 300, 210), mark(600, 250, 96)];

  // ---- typography ----
  const serif = (sz: number, w: string) => faces.serif(px(sz), w);
  const sans = (sz: number, w: string) => faces.sans(px(sz), w);

  const center = (
    txt: string,
    y: number,
    font: string,
    col: string,
    spacing?: string,
  ) => {
    x.font = font;
    x.fillStyle = col;
    x.textAlign = "center";
    x.textBaseline = "alphabetic";
    if (spacing) setLS(spacing);
    x.fillText(txt, px(600), px(y));
    setLS("0px");
  };

  /** Shrink-to-fit in device px; guarantees no overflow by construction. */
  const fit = (
    txt: string,
    make: (s: number) => string,
    maxW: number,
    base: number,
    min: number,
  ): number => {
    let s = base;
    x.font = make(s);
    while (s > min && x.measureText(txt).width > maxW) {
      s -= 1;
      x.font = make(s);
    }
    return s;
  };

  const wrap = (txt: string, font: string, maxW: number): string[] => {
    x.font = font;
    const words = txt.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (x.measureText(t).width <= maxW || !line) line = t;
      else {
        lines.push(line);
        line = w;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // header: real issuer + full title (shrink-to-fit, single line each)
  const org = data.org.toUpperCase();
  const orgSize = fit(org, (s) => faces.sans(s, "600"), px(1020), px(13), px(7));
  center(org, 300, faces.sans(orgSize, "600"), ink, ls(6));
  const subSize = fit(
    data.sub,
    (s) => faces.sans(s, "400"),
    px(1020),
    px(9.5),
    px(6.5),
  );
  center(data.sub, 336, faces.sans(subSize, "400"), "rgba(43,33,24,0.62)", ls(3));

  x.strokeStyle = gold;
  x.lineWidth = px(1);
  x.beginPath();
  x.moveTo(px(470), px(378));
  x.lineTo(px(730), px(378));
  x.stroke();
  x.beginPath();
  x.arc(px(600), px(378), px(3), 0, Math.PI * 2);
  x.fillStyle = gold;
  x.fill();

  center("CERTIFICATE", 470, serif(15, "400"), "rgba(43,33,24,0.7)", ls(9));
  center("OF EXCELLENCE", 528, serif(54, "500"), ink, ls(3));

  center(
    "is hereby awarded to",
    610,
    serif(21, "italic"),
    "rgba(43,33,24,0.72)",
  );

  // name: the large line. Single line with shrink-to-fit; balanced two-line
  // fallback for titles longer than the grid (never triggered by current data,
  // where the longest title fits at full size).
  const nameMaxW = px(980);
  let nameLines = [data.name];
  let nameSize = fit(
    data.name,
    (s) => faces.serif(s, "500"),
    nameMaxW,
    px(62),
    px(34),
  );
  x.font = faces.serif(nameSize, "500");
  if (x.measureText(data.name).width > nameMaxW) {
    const words = data.name.split(/\s+/).filter(Boolean);
    const probe = faces.serif(px(44), "500");
    x.font = probe;
    let best: [string, string] = [data.name, ""];
    let bestW = Infinity;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(" ");
      const b = words.slice(k).join(" ");
      const w = Math.max(x.measureText(a).width, x.measureText(b).width);
      if (w < bestW) {
        bestW = w;
        best = [a, b];
      }
    }
    nameLines = [best[0], best[1]];
    nameSize = fit(
      nameLines[0],
      (s) => faces.serif(s, "500"),
      nameMaxW,
      px(44),
      px(30),
    );
    const s2 = fit(
      nameLines[1],
      (s) => faces.serif(s, "500"),
      nameMaxW,
      px(44),
      px(30),
    );
    nameSize = Math.min(nameSize, s2);
  }
  const singleLine = nameLines.length === 1;
  const nameBaseY = singleLine ? 700 : 668;
  const nameLH = singleLine ? 0 : 62;
  x.fillStyle = ink;
  x.textAlign = "center";
  x.textBaseline = "alphabetic";
  nameLines.forEach((ln, i) => {
    x.font = faces.serif(nameSize, "500");
    x.fillText(ln, px(600), px(nameBaseY + i * nameLH));
  });

  // rule under the name (positioned from the real text block)
  x.font = faces.serif(nameSize, "500");
  const widest = Math.max(...nameLines.map((ln) => x.measureText(ln).width));
  const lastBase = nameBaseY + (nameLines.length - 1) * nameLH;
  const ruleY = lastBase + 26;
  x.strokeStyle = "rgba(138,106,52,0.75)";
  x.lineWidth = px(1.2);
  x.beginPath();
  x.moveTo(px(600) - widest / 2 - px(40), px(ruleY));
  x.lineTo(px(600) + widest / 2 + px(40), px(ruleY));
  x.stroke();

  // meta: blurb wrapped to at most 3 lines, shrinking if needed
  const metaMaxW = px(880);
  let metaSize = px(23);
  let metaLines = wrap(data.meta, faces.serif(metaSize, "italic"), metaMaxW);
  if (metaLines.length > 3) {
    metaSize = px(20);
    metaLines = wrap(data.meta, faces.serif(metaSize, "italic"), metaMaxW);
  }
  if (metaLines.length > 3) {
    metaSize = px(18);
    metaLines = wrap(data.meta, faces.serif(metaSize, "italic"), metaMaxW);
  }
  const metaStart = ruleY + 46;
  const metaLH = toGrid(metaSize * 1.48);
  metaLines.slice(0, 4).forEach((ln, i) => {
    center(ln, metaStart + i * metaLH, faces.serif(metaSize, "italic"), "rgba(43,33,24,0.66)");
  });

  // ---- focus chips (replace the invented signature block) ----
  // Greedy centred rows; engraved-pill treatment in the artwork's own
  // gold/ink palette. Current data lays out as one row (3-chip certs) or
  // two rows of two (the 4-chip CCNA) — verified spacing budgets in PORT-NOTES.
  const chips = data.chips.slice(0, 4).map((s) => s.toUpperCase());
  if (chips.length > 0) {
    const gap = px(16);
    const maxW = px(980);
    const layout = (devFont: number, padX: number) => {
      x.font = faces.sans(devFont, "500");
      const slack = devFont * 0.16; // letter-spacing compensation per char
      const ws = chips.map(
        (t) => x.measureText(t).width + padX * 2 + slack * t.length,
      );
      const rows: number[][] = [];
      let row: number[] = [];
      let rowW = 0;
      chips.forEach((_, i) => {
        const w = ws[i];
        const add = (row.length === 0 ? 0 : gap) + w;
        if (rowW + add > maxW && row.length > 0) {
          rows.push(row);
          row = [i];
          rowW = w;
        } else {
          row.push(i);
          rowW += add;
        }
      });
      if (row.length > 0) rows.push(row);
      const widths = rows.map((r) =>
        r.reduce((a, i, k) => a + ws[i] + (k === 0 ? 0 : gap), 0),
      );
      return { rows, widths };
    };
    let devFont = px(11);
    let padX = px(22);
    let laid = layout(devFont, padX);
    if (laid.rows.length > 2) {
      devFont = px(9.5);
      padX = px(18);
      laid = layout(devFont, padX);
    }
    const rowH = px(40);
    const rowGap = px(14);
    const totalH = laid.rows.length * rowH + (laid.rows.length - 1) * rowGap;
    const bandCY = px(1315);
    laid.rows.forEach((rowIdx, r) => {
      const cy = bandCY - totalH / 2 + rowH / 2 + r * (rowH + rowGap);
      let cx = px(600) - laid.widths[r] / 2;
      rowIdx.forEach((i) => {
        x.font = faces.sans(devFont, "500");
        const slack = devFont * 0.16;
        const w =
          x.measureText(chips[i]).width + padX * 2 + slack * chips[i].length;
        const pillR = rowH / 2;
        x.beginPath();
        x.moveTo(cx + pillR, cy - rowH / 2);
        x.lineTo(cx + w - pillR, cy - rowH / 2);
        x.arc(cx + w - pillR, cy, pillR, -Math.PI / 2, Math.PI / 2);
        x.lineTo(cx + pillR, cy + rowH / 2);
        x.arc(cx + pillR, cy, pillR, Math.PI / 2, Math.PI * 1.5);
        x.closePath();
        x.strokeStyle = "rgba(138,106,52,0.85)";
        x.lineWidth = Math.max(1, px(1.2));
        x.stroke();
        x.fillStyle = "rgba(43,33,24,0.88)";
        x.textAlign = "center";
        x.textBaseline = "middle";
        setLS(ls(2));
        x.fillText(chips[i], cx + w / 2, cy + devFont * 0.04);
        setLS("0px");
        cx += w + gap;
      });
    });
    x.textBaseline = "alphabetic";
  }

  // ---- wax seal (verbatim drawing; letter = issuer initial, a derivation
  // of real data — never an invented signatory) ----
  const seal = (cx: number, cy: number, r: number) => {
    const pts = 22;
    const path: string[] = [];
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const rr = r * (0.92 + Math.random() * 0.08);
      path.push(
        `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`,
      );
    }
    const grad = x.createRadialGradient(
      cx - r * 0.3,
      cy - r * 0.35,
      r * 0.1,
      cx,
      cy,
      r,
    );
    grad.addColorStop(0, "#c0392b");
    grad.addColorStop(0.55, "#8e2a20");
    grad.addColorStop(1, "#5e1a13");
    x.fillStyle = grad;
    x.beginPath();
    const [sx, sy] = path[0].split(",").map(Number);
    x.moveTo(sx, sy);
    for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i].split(",").map(Number);
      x.lineTo(ax, ay);
    }
    x.closePath();
    x.fill();

    x.strokeStyle = "rgba(0,0,0,0.28)";
    x.lineWidth = r * 0.08;
    x.stroke();
    x.font = faces.serif(r * 0.72, "500");
    x.fillStyle = "rgba(255,220,200,0.82)";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(data.sealLetter, cx, cy + r * 0.04);
    x.textBaseline = "alphabetic";
  };
  seal(px(600), px(1418), px(30));

  // ---- footer (credential-ID line dropped: no ID exists. A small ornament
  // holds the visual weight instead.) ----
  // The big year line is drawn only when a year is actually on record. The
  // three courses without one keep the footer line and the ornament below.
  center(data.dateLine, 1478, sans(11, "500"), "rgba(43,33,24,0.72)", ls(5));
  if (data.year) {
    center(data.year, 1534, serif(34, "400"), ink, ls(8));
  }

  const diaY = px(1562);
  x.strokeStyle = "rgba(138,106,52,0.7)";
  x.lineWidth = px(1);
  x.beginPath();
  x.moveTo(px(524), diaY);
  x.lineTo(px(584), diaY);
  x.moveTo(px(616), diaY);
  x.lineTo(px(676), diaY);
  x.stroke();
  x.fillStyle = gold;
  x.beginPath();
  const dr = px(5);
  x.moveTo(px(600), diaY - dr);
  x.lineTo(px(600) + dr, diaY);
  x.lineTo(px(600), diaY + dr);
  x.lineTo(px(600) - dr, diaY);
  x.closePath();
  x.fill();

  return { canvas: c, images };
}

/* ---------------- source §3 — sheet geometry ---------------- */

export function buildSheet(tex: T.Texture, segX: number, segY: number) {
  const geo = new T.PlaneGeometry(2.1, 2.9, segX, segY);
  const pos = geo.attributes.position as T.BufferAttribute;
  const base = new Float32Array(pos.array); // untouched positions

  const mat = new T.MeshPhysicalMaterial({
    map: tex,
    side: T.DoubleSide,
    roughness: 0.72,
    metalness: 0.0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.62,
    sheen: 0.5,
    sheenRoughness: 0.9,
    sheenColor: new T.Color("#f5e9cf"),
  });

  // soft rim + contact touch-light injected into the standard shader
  // (chunk patching verbatim from the source)
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uLightPos = { value: new T.Vector2(0.5, 0.5) };
    sh.uniforms.uRim = { value: 0.55 };
    // FIX (see PORT-NOTES): the authored loop drives
    // `material.userData.light` every frame, but nothing ever assigned it,
    // so hover-lighting was dead in the original. This single wiring line
    // connects the authored update path to the authored uniform.
    mat.userData.light = sh.uniforms.uLightPos.value;

    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        `
        #include <common>
        uniform vec2 uLightPos;
        varying vec2 vUv;
      `,
      )
      .replace(
        "#include <fog_vertex>",
        `
        #include <fog_vertex>
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      `,
      );

    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `
        #include <common>
        uniform vec2 uLightPos;
        uniform float uRim;
        varying vec2 vUv;
      `,
      )
      .replace(
        "#include <dithering_fragment>",
        `
        #include <dithering_fragment>
        float d = distance(vUv, uLightPos);
        float touch = smoothstep(0.34, 0.0, d);
        gl_FragColor.rgb += touch * 0.14 * vec3(1.0, 0.94, 0.82);
        float edge = 1.0 - smoothstep(0.0, 0.06, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
        gl_FragColor.rgb += edge * uRim * vec3(0.10, 0.09, 0.07);
      `,
      );
  };
  mat.customProgramCacheKey = () => "paperSheet";

  const mesh = new T.Mesh(geo, mat);
  return { mesh, base };
}

export type BuiltSheet = ReturnType<typeof buildSheet>;
