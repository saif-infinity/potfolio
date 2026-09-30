# PORT-NOTES — 3D Paper Certificates (inline homepage cards)

Source of truth: `reference/certificate-3d-paper.source.html` — the standalone
"3D Paper — Certificate" artifact (Three.js r149, authored `<script
type="module">` carried across; only the vendored r149 bundle was replaced by
npm `three@0.186.1` + `@types/three@0.186.0`).

SCOPE: the dedicated `/certificates` route was rejected. There is no route, no
selector, no `?slug` deep-linking. `src/components/sections/AwardsSection.tsx`
renders four cards; each card's paper is live 3D, all four driven by ONE
`WebGLRenderer` (`src/components/certificates/certStage.ts`) with artwork in
`src/components/certificates/paperArt.ts`.

---

## 1. r149 → 0.186 API port (exact list)

| # | Source (r149) | Port (0.186.x) | Why |
|---|---|---|---|
| 1 | `renderer.outputEncoding = T.sRGBEncoding` | `renderer.outputColorSpace = T.SRGBColorSpace` | Legacy encoding API removed in r152. Modern default; stated explicitly for clarity. |
| 2 | `tex.encoding = T.sRGBEncoding` on the certificate CanvasTexture | `tex.colorSpace = T.SRGBColorSpace` | Same removal. Keeps the parchment reading as authored. |
| 3 | env CanvasTexture with implicit LINEAR | `envTex.colorSpace = T.LinearSRGBColorSpace` | Preserves the original lighting response exactly (was implicit under r149 color management). |
| 4 | `THREE.ColorManagement` legacy behaviour | No code change | Only Directional + Ambient lights are used, so the r155 physical-lights change is numerically a no-op for this scene. Intensities (1.05 / 0.35 / 0.25) port 1:1. |

Everything else ports 1:1: `onBeforeCompile` + shader-chunk patching
(`common`, `fog_vertex`, `dithering_fragment` — all still present in 0.186),
`customProgramCacheKey`, `PMREMGenerator.fromEquirectangular`,
`PlaneGeometry` segmentation, interaction handlers, throw physics, detent
settling, reduced-motion branch, `MeshPhysicalMaterial` sheen/clearcoat
params, ACES tone mapping.

## 2. The one behaviour FIX: dead touch-light wiring

The source injects a `uLightPos` uniform and then updates it every frame via
`material.userData.light?.set(light.x, light.y)` — but nothing ever assigns
`userData.light`, so hover-to-light is silently dead in the original (the
uniform sits at 0.5,0.5 forever). The port adds ONE line inside
`onBeforeCompile` (`mat.userData.light = sh.uniforms.uLightPos.value`); the
authored per-frame update line is byte-identical. Verified by intent: the task
advertises "move the pointer over it to light it", and the author clearly
wrote the update path for that. Hovering a card now moves the warm touch
spot with the pointer.

## 3. Real content (no invented data — hard rule)

Source placeholders (`ORBIT SOCIETY OF DESIGN`, `Nocturne Studio`,
`Ilya Marchetti` / `Dara Okonkwo`, `OSD-2026-0417`, wax `O`) are ALL gone.
Mapping from `site.certificates`:

- `CERT.org` → `issuer` (uppercased header line)
- `CERT.sub` → `fullTitle` (secondary line)
- `CERT.name` → `title` (the large line)
- `CERT.meta` → `blurb` (wrapped to ≤3 lines)
- Footer → `AWARDED · {year}` + large `{year}`. No credential ID exists in
  the data (deliberately — see site.ts), so the `CERTIFICATE No.` line is
  dropped and a small gold diamond ornament holds the visual weight.
- Signature block → `focus` skill chips (uppercased, engraved-pill
  treatment in the artwork's gold/ink palette, greedy centred rows).
  Presenting invented people as signatories was not an option.
- Wax seal letter → first alphanumeric of the **issuer** (`C` for Cisco,
  `A` for Amazon Web Services) — a derivation of printed data, not a claim.
- `OF EXCELLENCE` / `is hereby awarded to` boilerplate kept verbatim; it is
  generic certificate language, not identity.

CAVEAT carried through (do not present as verified): all four `year` values
are `"2025"`, flagged in `src/data/site.ts` as UNCONFIRMED against the real
CV. They render as given.

## 4. Layout robustness (text length changed, so positions had to adapt)

Authoring grid stays 1200×1656. Header lines use shrink-to-fit (org from 13,
sub from 9.5, minima 7/6.5, max width 1020); the large title fits single-line
62→34 (longest real title, "Introduction to Cybersecurity", fits at full
size) with a balanced two-line fallback; the name rule measures the real text
block; the blurb wraps to ≤3 lines with 23→20→18 shrink steps. No overflow is
possible by construction (fit loops + word wrap, longest single words are
~200 units against a ~980 budget). Vertical budget re-verified: name rule →
meta (ends ≤ ~880) → laurel (1055–1265) → chips (band centred 1315, 1–2 rows;
4-chip CCNA flows 2+2) → seal (600,1418 r30) → footer (1478/1534) → diamond
(1562, clear of the 1572 inner frame).

## 5. Card architecture (scope-driven deviations)

- **One renderer, four viewports.** `initCertStage` owns a single fixed,
  transparent (`alpha:true`, clear alpha 0) canvas. Per frame: scissor test
  OFF → `clear()` once → per on-screen card `setViewport` / `setScissor` /
  `clearDepth` / `render` with its own Scene + PerspectiveCamera + mesh +
  texture. `clearDepth` per card is load-bearing. `autoClear=false`.
- **Shared:** renderer, PMREMGenerator, env CanvasTexture, PMREM output.
  **Per card:** scene, camera, 3 lights (verbatim intensities), sheet,
  certificate texture.
- **Drag** attaches to each card's stage element (canvas is
  `pointer-events:none`); drag state, velocity, detents and hover-light are
  per-card, so dragging card 2 never moves card 1.
- **Motion:** throw physics + detent settling verbatim per card; scroll adds
  a signed drift (`∓0.7` by viewport-centre progress, alternating direction)
  plus a gentle idle sway (phase-offset per card). Both are skipped under
  `prefers-reduced-motion`; drag always works.
- **Stacking:** canvas is `position:fixed; z-index:30` — above card
  backgrounds, below the navbar (z-50) and the site grain (z-60). Card text
  lives entirely BELOW the stage rect in normal flow, so the opaque paper can
  never cover copy. No per-pixel interleave attempted.
- **Gating:** IntersectionObserver on the section starts/stops the whole RAF
  and hides the canvas off-screen; per-card rect checks skip off-screen
  renders every frame.
- **Dropped source CSS:** the source's `body{overflow:hidden;touch-action:none}`
  lock is gone (homepage must scroll; only the stage sets touch-action, and
  `pan-y` so vertical page scroll still works from the paper). The source's
  grain/vignette overlays and giant wordmark are gone — the site body already
  applies grain + vignette; doubling them was visible.
- **Dropped dead code:** `window.__sheet` / `window.__raf` globals (the React
  cleanup leaves no globals), the unused `P()` helper, badge/hint DOM (a
  minimal `drag to turn` hint lives in the stage corner).

## 6. Perf reductions (mandatory at 4× — recorded with reasons)

| Reduction | Source | Cards | Reason |
|---|---|---|---|
| Tessellation | 72×96 (~7k verts + full normal recompute/frame) | 24×32 (~800 verts) | At ~300×400 CSS px the fine grid is pixel-invisible; ×4 sheets would be ~28k vertex writes + 4 `computeVertexNormals()` per frame. Bend/fold math is verbatim, just fewer samples. |
| Texture | 1400×1932 (~10.8MB ×4 ≈ 43MB VRAM) | 800×1104 (~3.5MB ×4 ≈ 14MB) | Matches card device resolution at DPR 1.5; the source size is pure oversampling here. Blotch/fibre counts density-scaled; letter-spacing scales with S. |
| DPR cap | `min(dpr, 2)` | `min(dpr, 1.5)` | Four scissored viewports share one fill budget. |

## 7. Font gate (load-bearing ×4)

Same `document.fonts.load` set as the source (EB Garamond 400/500/italic-400,
Inter Tight 600/italic-500), built from the hashed next/font stacks read off
`--font-eb-garamond` / `--font-inter-tight` on `documentElement` (literal
`"EB Garamond"` does not resolve), settled individually via
`Promise.allSettled`, resolved ONCE and shared — no texture is rasterised
before the gate clears.

## 8. Cleanup

`destroy()` cancels the RAF, disconnects the observer, removes the resize
listener + all per-card pointer listeners (+ `pointercancel`), removes the
reduced-motion listener, and disposes all 4 geometries/materials/textures,
the shared PMREM output, the generator, the env texture, and the renderer.

## 9. Verification

- `npx tsc --noEmit` clean (project files; pre-existing sibling `/crt`
  errors excluded — out of scope).
- Grep: no `Marchetti`, `Okonkwo`, `Nocturne`, `OSD-`, `Orbit Society` in
  shipped output.
- Sibling scaffolding confirmed live: `three@0.186.1` + `@types/three@0.186.0`,
  `src/lib/fonts.ts` (vars on `<html>` via layout), `site.certificates`
  (4 slugs). Years-rendered-as-fact caveat noted above.

---

# PORT-NOTES — ASCII Particle Field (`/home` background)

Source of truth: `reference/particle-drift.source.html` — only the
`// --- ASCII Particle System Implementation ---` script section (from
`const canvas = ...` through `draw();`) was ported, line-for-line, into
`src/components/background/ParticleField.tsx` (+ co-located
`ParticleField.module.css`). Mounted in `src/app/home/page.tsx` as the
first child. All demo chrome dropped: gradient border shell, matte noise
overlay, left copy column, badge, heading, slider, media frame,
glassmorphism floating card, every GSAP call.

Colour map (source blue -> matrix/cyber green, all alpha math identical):

- `rgba(96, 165, 250, A)` (beams AND mouse connection links)
  -> `rgba(0, 255, 65, A)`
- `'#60A5FA'` (hot node glyph fill) -> `'#00FF41'`
- `rgba(156, 163, 175, A)` (proximity lines) -> `rgba(74, 222, 128, A)`
- resting glyph fill `rgba(156, 163, 175, 0.4)`
  -> `rgba(74, 222, 128, 0.4)`

Deliberate deviations (2):

1. `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)` instead of the source's
   `ctx.scale(dpr, dpr)` — the source compounds the scale on every resize;
   same DPR result, no drift bug.
2. Reduced-motion / visibility gating — `prefers-reduced-motion: reduce`
   renders one static frame with no rAF (framer's `MotionConfig
   reducedMotion="user"` covers the sections; the canvas needs its own
   gate), and the loop pauses on `document.visibilitychange` (hidden) and
   resumes when visible.

Stacking: the host is `position: fixed; inset: 0; z-index: 0;
pointer-events: none` — above `body`'s haze, behind every section and
behind all `.glass` surfaces (glass blur samples it from underneath).
`<main>` gained `relative z-10` because `SkillsSection`/`ProjectsSection`
carry semi-transparent `bg-bg2/30` backgrounds on z-auto section roots;
the explicit layer guarantees content-over-canvas ordering without
touching glass or scroll behaviour. Navbar (`fixed z-50`), grain (z-60)
and vignette (z-55) keep their existing order above it.

Engineering: rAF id in a ref, cancelled on unmount; `resize` +
`mousemove` + `visibilitychange` + motion-query listeners all removed on
unmount; StrictMode-safe (cleanup stops the loop, no duplicate
listeners); SSR-safe (all `window`/`document` access inside the effect,
ref null-checked). No new dependencies. `/` splash untouched.

Verification: `npx tsc --noEmit` clean. Browser rendering not verified
here (no browser in this environment).

---

# THEME RETINT — Zenith demo parity (cold green cyber)

Source of truth for the target look: `reference/particle-drift.source.html`
("Zenith Compute Network" demo) — page `#030509`, hairline line language
(`rgba(255,255,255,0.05/0.10/0.20)`, 12px corner brackets, 1px gradient
shell `24px` / inner `23px`), centred `max-w-[1440px]` framed panel. The
demo's `#60A5FA` blue maps to the already-adopted matrix green `#00FF41`.
Existing faces kept (EB Garamond + Inter Tight are the Playfair/Inter
equivalents); no new fonts, no new dependencies.

## 1. Palette map (before -> after, token-first)

`tailwind.config.js` + `src/app/globals.css` (`:root`) kept in sync:

| Token | Before | After |
|---|---|---|
| `bg` / `--bg` | `#0a0505` | `#030509` |
| `bg2` / `--bg-2` | `#150b0b` | `#0a1118` |
| `fg` / `--fg` | `#f5f0eb` | `#ffffff` |
| `muted` / `--muted` | `#a8a09e` | `#9ca3af` |
| `primary.DEFAULT` / `--primary` | `#ff073a` | `#00ff41` |
| `primary.hover` | `#ff2a55` | `#5cff7a` |
| `primary.dim` | `#c2052e` | `#12933d` |
| `accent.violet` | `#7d5cff` | `#4ade80` (== `rgba(74,222,128,·)`, the particle resting green) |
| `accent.cyan` | `#00e5ff` | `#2dd4bf` (teal) |
| `boxShadow.glow` | `rgba(255,7,58,0.55)` | `rgba(0,255,65,0.55)` |
| `boxShadow.glow-sm` | `rgba(255,7,58,0.45)` | `rgba(0,255,65,0.45)` |

`glass` / `hairline` tokens untouched. `viewport.themeColor` in
`src/app/layout.tsx`: `#0a0505` -> `#030509`.

`globals.css` derivations: body haze is now cold green on `#030509`
(`rgba(0,255,65,0.07)` / `rgba(45,212,191,0.06)` /
`rgba(74,222,128,0.05)` over `#030509 -> #060b0e -> #030509`, all low
alpha so the particle field reads through); `.glass` fill + sheen + inset
rim retinted cold (`rgba(8,14,18,0.45)`, green/teal sheen stops,
`rgba(0,255,65,0.07)` inset); `.glass-hover` fill/border green;
no-backdrop-filter fallbacks `#0b1218` / `#060a0e`; `.rim-red` (name kept
to avoid churn) now a green rim; `.text-gradient-primary` now
`#00ff41 -> #5cff7a -> #2dd4bf`; `.crt-melt` + scrollbar track on
`#030509`, thumb `#00ff41` / hover `#5cff7a`. Hero portrait grade
(`HeroSection.tsx`) moved from red (`sepia(0.25) hue-rotate(-14deg)`) to a
green cyber grade (`sepia(0.35) hue-rotate(70deg)`); all token-driven hero
chrome (halo, wash, ring, stats, badge) follows automatically.

## 2. Line language

Sections already used `border-hairline` + `rounded-2xl` cards and
`rounded-full` pills, so the token retint carries them. No heavy/colourful
borders existed outside token-driven 1px rings; the 1px decorative accents
(hero stats tick, awards hover sheen) were left as-is — now green via
tokens. Corner brackets added to the shell inner surface: four
`h-3 w-3` L-shapes (`border-t/b + border-l/r`, `border-white/20`) at
`top-6/right-6/bottom-6/left-6`, `pointer-events-none`, `z-20`.

## 3. Container position

`src/app/home/page.tsx`: the seven sections' inner content is untouched;
they are now wrapped in a centred `max-w-[1440px]` shell reproducing the
demo placement — outer `rounded-[24px] p-px` div with the demo's gradient
border (inline style, byte-equal stops), inner `rounded-[23px] bg-bg` div
with the demo's inset `box-shadow: rgba(255,255,255,0.02) 0 0 40px 0
inset` + `overflow-hidden`. Gutters (`px-4/md:px-12`, top `pt-24/md:pt-28`
to clear the fixed navbar, bottom `pb-4/md:pb-12`) let the fixed
`ParticleField` show through around the frame. Stacking preserved:
`ParticleField` still `fixed z-0` full-viewport behind; the `z-10` layer
moved from `<main>` to the shell wrapper; Navbar / grain / vignette order
unchanged; no scroll-behaviour changes.

## 4. Deliberately NOT changed (exact-fidelity rule)

- `FS_BTN` shader in `src/components/ui/KineticButton.tsx` — untouched.
  Its chrome in `KineticButton.module.css` (focus ring `#00e5ff`, cyan
  label glow + fallback ring) still references the old cyan. Retinting the
  chrome alone would mismatch the cyan in-shader arcs, so it is reported,
  not done. If the button shader is ever re-graded green, update the
  module.css focus/fallback/label glows in the same pass.
- `src/components/certificates/` — untouched, including the `.stage`
  `rgba(255,7,58,0.1)` top glow in `certificates.module.css`. The baked
  paper artwork is warm parchment; a green stage glow would fight it, so
  it is reported, not done.
- `ParticleField.tsx` — untouched (already `#00FF41` /
  `rgba(0,255,65,·)` / `rgba(74,222,128,·)`).
- Grep confirms these two module.css lines are the only remaining
  old-palette hardcodes under `src/`.

Assumption: "match the live demo" meant its layout/chrome language
(shell, hairlines, brackets, cold near-black) with green substituted for
the demo's blue — not a literal blue copy, since matrix green was already
chosen for the particle field.

Verification: `npx tsc --noEmit` clean (no output).

---

# SECTION RHYTHM REWORK — variation within a system

Problem: every section was the same centered `py-24 sm:py-32` band with a
centered heading block — seven identical blocks, flat vertical rhythm.

System: one shared header vocabulary (`SectionHeader` in
`src/components/motion/Reveal.tsx` — bracketed two-digit index `[01]`–`[07]`,
uppercase hairline-tracked label on a `bg-hairline` rule, display serif
heading, short muted lede), aligned differently per section. Shell chrome,
`bg-bg/70` translucency, tokens, fonts, all copy, and all effect internals
(KineticButton shader, certificate WebGL + stage wiring, ParticleField)
untouched. `src/app/home/page.tsx` untouched. No new colours, fonts,
dependencies, or comments.

Rhythm (alternating density): hero (tall, natural height) -> services
generous (`pt-24 sm:pt-32 / pb-20`) -> projects tight band (`py-20 sm:py-24`)
-> awards tight top + stagger room (`pt-16 sm:pt-20 / pb-24 sm:pb-28`) ->
skills tight ledger (`py-16 sm:py-20`) -> experience generous (`py-24
sm:py-32`) -> contact generous top, tight tail (`pt-24 sm:pt-28 / pb-14`).

Per section (file: composition — reasoning):

- `hero/HeroSection.tsx`: 12-col asymmetric split (copy 7 left-anchored with
  `[01]` marker, portrait 5 overlapping via offset hairline frame behind it);
  stats become a full-bleed `border-y` hairline strip with `divide-hairline`
  cells; social pill + scroll cue move from absolute overlays into a normal
  bottom row. Reasoning: the old `min-h-screen` inside the shell's `pt-24`
  trapped the fold inside the hero; natural height + strip lets services peek,
  and the strip is the first full-bleed band.
- `sections/WhatIDoSection.tsx`: narrow left header rail (`300px`) beside the
  cards; first of 5 services spans 2 cols as a horizontal feature card.
  Reasoning: left rail breaks centering cheaply; the feature card absorbs the
  odd 5-count into a 1+2+2 rhythm instead of a ragged grid.
- `sections/ProjectsSection.tsx`: second full-bleed band (kept translucent
  `bg-bg2/30` + `border-y`); header flush-right; 3 projects as alternating
  7/5 split rows with a giant `text-fg/10` ghost numeral + hairline rule in
  the side column. Reasoning: rows alternate direction so the eye zigzags;
  ghost numerals give large-type texture without new copy.
- `sections/AwardsSection.tsx`: flush-left header with a hairline rule
  bleeding past the content column (`-mr-6 lg:-mr-10`); odd cards drop via
  `xl:mt-12` margin offset (margin, not transform, so framer reveals keep
  working). Reasoning: stagger breaks the 4-up monotony; all 3D stage logic,
  refs, and card copy byte-identical in intent.
- `sections/SkillsSection.tsx`: 5 groups as full-width ledger rows
  (`sm:grid-cols-[240px_1fr]`, hairline top rules, numbered `01`–`05`, icon +
  group left, chips right). Reasoning: ledger reads as an index/catalogue —
  the calmest dense section, contrasting the card grids around it.
- `sections/ExperienceSection.tsx`: sticky narrow side header
  (`lg:sticky top-28`) beside the timeline; timeline markup and node offsets
  unchanged. Reasoning: the header rides along the longest read on the page,
  and the side column completes the header-alignment set (left rail, right,
  side-sticky, right-mirror).
- `sections/ContactSection.tsx`: mirrored split — DETAILS glass card left,
  pitch right-aligned right (`[07]` header row mirrored, lede `ml-auto`,
  buttons `justify-end`); footer unchanged. Reasoning: mirroring the old
  pitch-left layout gives the page a closing gesture toward the right edge.

Anchors: `#top #services #projects #awards #skills #experience #contact`
each present exactly once (grep), every section keeps its `scroll-mt-24`
(hero keeps none, as before); navbar brand/CTA/cue links unaffected.

Left alone: shell, particle field, all shaders/stages, glass/hairline tokens,
footer, mobile menu, navbar. Unverifiable without a browser: the awards
`xl:mt-12` stagger against the fixed WebGL canvas rects (rects are measured
live, so it should track, but not seen); hero fold position at 1440px; ghost
numeral legibility over the moving field at low opacity.

Verification: `npx tsc --noEmit` clean.

---

# CERTIFICATIONS — cards removed, single sheet on the registry press

`src/components/sections/AwardsSection.tsx` rebuilt; the 4-card
`RevealGroup` grid (`sm:grid-cols-2 xl:grid-cols-4` glass cards) is gone.
New structure, top to bottom: `SectionHeader [04]` with rewritten sub ->
right-bleeding hairline rule -> 4-row registry `tablist` (ledger language,
same as Skills) -> wide press frame (`border border-hairline` with four
corner brackets) holding ONE visual 3D stage beside the active record's
details (`lg:grid-cols-[1fr_300px]`, stacked on mobile) -> left-bleeding
hairline rule to close.

3D survival: all four `styles.stage` divs still mount and stay
`initCertStage`-wired exactly as before (same `stageRefs`, same slots, same
`destroy()` cleanup, same full-bleed `.gl` canvas). They are stacked
`absolute inset-0` inside a real sized box (`aspect-[4/3] sm:aspect-[16/10]`,
never zero-height), crossfading via opacity; inactive sheets get
`pointer-events:none` + `aria-hidden` so only the active sheet takes drag.
The camera reframes per element aspect each frame, so the portrait sheet
fits centered in the wide box. `drag to turn` hint renders on the active
sheet only.

Switcher: registry rows are native buttons (`role=tab`,
`aria-selected`, `aria-controls="cert-panel"`; press box is the
`tabpanel`). Selected state is not colour-only: primary index numeral,
`ON PRESS` pill, arrow affordance on hover for the rest, plus
`aria-selected`. Keyboard: all rows tabbable, Enter selects natively,
ArrowUp/Down/Home/End move selection and focus. Details panel crossfades
per record (`AnimatePresence mode="wait"`, keyed by slug, same
`[0.21,0.47,0.32,0.98]` ease as the reveals). Every certificate's
icon/year/title/issuer/blurb/focus chips remain reachable — nothing dropped.

Rewritten sub: "A single sheet on the registry press. Select a record to
change the sheet — drag it to turn." Short, factual, matches the new
single-sheet presentation.

Untouched: `id="awards"`, `scroll-mt-24`, all of
`src/components/certificates/` (4 files present, none modified),
ParticleField, KineticButton, the other six sections. Tokens only, no new
colours/fonts/deps/comments.

Verification: `npx tsc --noEmit` clean.

---

# CERTIFICATIONS — compact press left, title+year list right

`src/components/sections/AwardsSection.tsx` reworked again per request:
no full-width stage, no descriptions. Structure, top to bottom:
`SectionHeader [04]` with new sub -> right-bleeding hairline rule ->
two-column body -> left-bleeding hairline rule to close.

Two-column body (`lg:grid-cols-[340px_1fr]`, stacks vertically below `lg`
with the press first): compact press frame on the left
(`border border-hairline` + four corner brackets, capped at
`max-w-[320px]` centered below `lg`), title+year registry `tablist` on the
right. The details panel (icon, issuer, blurb, focus chips) is deleted from
the section — each row now renders exactly the certificate title and its
year, plus the index numeral and the selection affordance (`ON PRESS` pill
when active, arrow on hover otherwise).

Stage: `aspect-[3/4]` — near-native to the portrait parchment sheet
(~5:7), so the camera fit fills the frame instead of letterboxing the way
`16/10` did. Real non-zero box at every breakpoint (320px cap on mobile,
340px column on desktop). All four `styles.stage` divs still mount stacked
`absolute inset-0`, crossfading on opacity, inactive sheets
`pointer-events:none` + `aria-hidden`; `initCertStage` call, `stageRefs`,
full-bleed `.gl` canvas and `destroy()` cleanup unchanged. Tablist wiring
unchanged: `role=tab` + `aria-selected` + `aria-controls="cert-panel"`,
press box is the `tabpanel`; Tab/Enter/ArrowUp/Down/Home/End all work;
selected state never colour-only.

Sub: kept, rewritten to "Four records, one press. Select a record to
change the sheet." Kept because the list-to-press relationship is the
section's only interaction and needs one line; the drag instruction moved
entirely onto the press's own `drag to turn` hint.

Untouched: `id="awards"`, `scroll-mt-24`, all of
`src/components/certificates/` (4 files present; never written to in this
pass), ParticleField, KineticButton, the other six sections. Tokens only,
no new colours/fonts/deps/comments.

Verification: `npx tsc --noEmit` clean.

## Fix: selecting a certificate did not change the press (2026-09-29)

Symptom: clicking a row in the Certifications list updated the row
highlight and the `ON PRESS` pill, but the 3D sheet on the left never
changed.

Cause — a layout/architecture mismatch, not a style problem. The four
`styles.stage` divs are empty measurement boxes (they hold only the
`drag to turn` hint); the parchment is painted by WebGL onto the single
shared `.gl` canvas through per-card scissored viewports, positioned from
each box's rect. When the layout went compact, the four boxes became
stacked `absolute inset-0`, so all four rects became the SAME rectangle and
`tick()` drew all four certificates into that one rect, on top of each
other. The `opacity: i === active ? 1 : 0` crossfade on the boxes was
inert: those boxes are transparent, so nothing ever faded. Selection
never reached WebGL at all.

Fix — selection is wiring, not rendering:
- `CardState` gained an explicit `index` field, set from the `index`
  already passed to `attachCard`. It was previously used only for
  `phase`, which made the mapping implicit and unsafe to rely on.
- `initCertStage` holds a closure-level `activeIndex`, read fresh inside
  `tick()` so a `setActive()` issued before the async font/paint boot
  resolves still applies, and skips every card whose `index` is not the
  active one. Same `continue` site as the existing off-screen cull.
- `initCertStage` now returns `{ setActive, destroy }`; `setActive` is
  integer-guarded and clamped to `slots.length - 1` (not
  `cards.length`, which is 0 until boot finishes).
- `AwardsSection` keeps the handle in a ref, calls `stage.setActive(active)`
  in an effect on `[active]`, and seeds the initial value at init. The
  stage is still constructed once (`[]` deps). Removed the inert opacity
  crossfade; the unselected boxes are now inert measurement boxes with
  `pointer-events: none` + `aria-hidden` preserved. Dropped the redundant
  `role="img"` + per-box `aria-label` — the press box is already
  `role="tabpanel"` with an `aria-label` bound to the active certificate.

Deliberately NOT changed: `paintCertificate`, `buildSheet`, throw physics,
detent settling, vertex bend/fold, scroll drift, idle sway, light easing
and the camera framing math. How a sheet renders is the ported effect; only
which sheet renders changed.

Side effect: this section now scissor-draws one sheet per frame instead of
four.

Verification: `npx tsc --noEmit` clean. Rendering-constant fingerprint
re-checked against the source values (0.94 decay, `dt*7` detent, `dt*9`
smoothing, `pull*3.1` fold, `t*0.45` sway, `phase = index*1.7`, camera
`sheetH 2.9` / `sheetW 2.1` framing). Behaviour not verifiable without a
browser: the crossfade is now a hard switch (no fade on switch), and drag
still needs a pointer on the newly active sheet.

---

# WHAT I DO — star-topology connector layer

`src/components/sections/WhatIDoSection.tsx` only; nothing else touched.
The five cards already formed a star (featured card 0, "SOC & BLUE TEAM",
spanning `sm:col-span-2` as the hub/core; cards 1-4 in a 2x2 as nodes), so
the layer wires that topology instead of inventing one: a vertical trunk
drops from the hub's bottom-center port down the column gutter, with one
horizontal branch per node row reaching each card's gutter-side edge, and a
node/port dot where every line meets a card.

DOM: the `RevealGroup` grid is wrapped in a `relative` div; an inline SVG
(`absolute inset-0 z-0`, `aria-hidden`, `pointer-events-none`) renders
behind the grid (`relative z-[1]`), so lines live under the `glass` cards
and all text stays above them. Stubs terminate 4px short of card edges and
dots sit fully inside the 20px gutters, so no line ever goes under card
glass or near text. All strokes are 1px `stroke-primary` at 0.3-0.4
opacity, no bloom; dots are `fill-bg`/`stroke-primary`, lighting to
`fill-primary` with an outer ring on hover. Tokens only, no new colours.

Tracking: measured, not CSS-relative. A `useLayoutEffect` reads the
wrapper + five card rects (wrapper-relative), stores trunk/branch/dot
coordinates in state, and recomputes via a single `ResizeObserver` on the
wrapper (covers resize, zoom, and font-swap reflow), a `min-width: 640px`
media-query listener, and one `document.fonts.ready` pass. Cleanup
disconnects the observer, removes the MQ listener, and guards the font
promise with an alive flag. Measurement is safe because grid stretch makes
row-mates equal height, and the two columns are symmetric so the trunk at
50% always lands in the gutter. Choreography: cards land first on the
existing `RevealGroup`/`revealItem` stagger, then trunk/branches draw via
`pathLength` (`delayChildren` 0.9, stagger 0.08, 0.45s each) with dots
fading in; `useReducedMotion` jumps the whole layer to its final state.

Mobile degradation: below `sm` the layer renders nothing (media query
gates measurement, `hidden sm:block` belts-and-braces). A single column is
a linear chain, not a star, and any line there would sit on card chrome or
dangle in inter-card gaps — noise without diagram meaning — so the grid
stands alone.

Hover-lift resolution: the `whileHover={{ y: -6 }}` lift is REMOVED. A
lifted card would detach its anchored stub by 6px and break the diagram on
every hover. It is replaced by link-LED feedback: hovering or focusing a
card (mouse + keyboard, no new interactive elements, reading order
unchanged) lights that node's dot and brightens its branch and the hub
trunk. The existing border/glow/icon-tile hover transitions already carry
the tactile feel, so nothing is lost.

Overflow/z-index reasoning: the SVG is confined to the wrapper box
(`inset-0`, all coordinates interior, dots 4px inside gutters), so no
horizontal overflow is possible at 320/375/768/1024/1440 — and below `sm`
it is not rendered at all. z-0 layer vs z-[1] grid keeps lines under
glass; particle field (z-0, fixed) and cert canvas (z-30, fixed) are in
other stacking contexts and unaffected.

Verification: `npx tsc --noEmit` clean. Not verifiable without a browser:
pixel alignment of stubs/dots to card edges at each breakpoint, draw-in
timing against the card stagger, and the LED response feel on hover.

### Correction after review: measurement read transformed rects

The first pass measured card positions with `getBoundingClientRect()`. That
is wrong here: the cards animate in with `revealItem`
(`hidden: { opacity: 0, y: 28 }`) under a 0.09s stagger, so `useLayoutEffect`
reads rects while every card is translated 28px down and still moving. Since
a transform does not change layout size, the `ResizeObserver` never fires
again once the cards land, so the geometry would have stayed up to 28px out —
and by a different amount per card, given the stagger.

`rel()` now walks `offsetParent` and sums `offsetLeft`/`offsetTop`, using
`offsetWidth`/`offsetHeight`. Those are untransformed layout values, so the
connectors are correct both during and after the reveal. The wrapper itself is
still measured with `getBoundingClientRect()` for its own size and is not
transformed.

Verified: `npx tsc --noEmit` clean. Still not verifiable without a browser:
per-breakpoint alignment of stubs/dots to the card edges, and whether the
`hidden sm:block` fallback is ever needed given the media query already gates
measurement.

---

# WHAT I DO — live network: drift + pointer easing on the connector layer

Same file, same section only (`WhatIDoSection.tsx`). Cards keep the grid:
layout, reading order, copy and LED feedback untouched. Only the diagram is
alive — the 5 node dots (hub port + 4 node ports) drift on randomised
resting offsets and ease toward the pointer, with trunk/branches re-derived
from the moved dots every frame so lines stay attached.

Drift model: each dot owns a resting offset that lerps (0.035/frame)
toward a per-dot target; targets retarget on staggered 2.0-3.8s intervals
to uniform random points in a 5px disc. RNG is `mulberry32(0xc0ffee)` in a
ref — deterministic per mount, stored outside React state, never
re-randomised by renders. The rAF loop seeds from the same `statOff` values
used for first paint, so there is no snap on loop start.

Pointer model: raw pointer (wrapper-relative, written to a ref on
`mousemove`, no setState) is itself smoothed (0.2 lerp), then each dot is
pulled toward it with Gaussian falloff `exp(-d^2 / 2σ^2)`, σ = 150px, max
12px at zero distance — far dots barely react. A presence factor lerps
0→1 while the pointer is inside the wrapper and back to 0 on leave, so the
section settles to its rest wander when idle. Per-frame compose is
rest + pull, critically damped by chained lerps rather than a spring
integrator (no velocity state, no overshoot into card text).

Bounds: total offset clamped to 10px magnitude, plus directional caps —
node dots may drift at most 3px toward their card (outward into the gutter
is free), hub dot at most 4px upward toward the hub. Anchors sit 4px off
the edges and card padding is 24px, so drifting dots stay inside the
wrapper, inside gutters, and never reach text. Anchors still come from the
untransformed offsetParent-walk measurement; drift applies purely as a
delta on top.

Performance: one rAF loop, 7 attribute writes per frame (5 dot-group
`transform`s + 2 branch `d`s; trunk is static) via refs — zero React state
per frame, no re-render storm. Hover/focus LED stays in React (`hot`
state) because it changes only on enter/leave; the LED ring lives inside
the moving dot group so it tracks automatically. Loop pauses via
IntersectionObserver on the wrapper (threshold 0) plus a
`visibilitychange` guard; cleanup cancels the frame, disconnects the
observer, and removes the listener. It does not compete with the
ParticleField rAF: separate loops, separate DOM, both independently gated,
and this one is 7 writes versus a full canvas repaint.

Reduced motion: no loop, no pointer handlers, no retargeting. Dots render
once at the seeded `statOff` resting positions with branches derived from
them — randomised per mount, stable thereafter — and the draw-in jumps to
final via the existing `initial={false}` path.

Verified: `npx tsc --noEmit` clean. Not verifiable without a browser: the
fluidity of the wander/pull balance (constants are reasoned, not tuned by
eye), branch diagonals staying near-horizontal at full pull, and the
settle-back feel on pointer leave.

### Corrections after review: the rAF loop and the transform owner

Two real defects in the first animated pass, both fixed.

1. The loop never stopped. `step()` re-armed itself with
   `requestAnimationFrame` on its first line, *before* the visibility and
   geometry guards, so `visRef` / `hidRef` only skipped the work — the loop
   kept firing at 60fps indefinitely. Worst case is mobile: `measure()` sets
   `geom` to null below `sm` and it never becomes non-null, so that was a
   permanent idle wakeup on every phone.

   `step()` now stops itself (sets `running = false`, cancels the pending
   frame) as soon as the section is off-screen, the tab is hidden, or there
   is no geometry. A `start()` helper re-arms it, called from the
   IntersectionObserver callback, the `visibilitychange` handler, and once on
   mount. The effect now depends on `[reduceMotion, geom]`, so the first
   successful measurement restarts it — this is required, not cosmetic: the
   effect's initial run sees `geomRef.current === null` because the state
   update from `measure()` has not been committed yet, and without a restart
   trigger the loop would never start at all.

2. framer-motion was fighting the loop. The per-frame
   `setAttribute("transform", ...)` was written onto `motion.g` elements.
   framer-motion owns the transform of a motion component and re-applies it
   on re-render, so every `hot` change (which re-renders this subtree) reset
   all five dots to their static `statOff` for a frame.

   Each dot group is now a `motion.g` that animates opacity only, wrapping a
   plain `<g>` that owns the transform and receives the ref. framer never
   writes to the plain element, so the loop and React no longer fight. The
   branch `d` attribute is unaffected: React only re-applies `d` when the
   prop value actually changes, and `branchD()` is deterministic, so the
   loop's live `d` survives re-renders.

Verified: `npx tsc --noEmit` clean. Confirmed by inspection that no `motion.g`
carries a `transform` prop. Still not verifiable without a browser: that the
loop restarts on scroll-in, and the dot drift under real pointer input.

---

# WHAT I DO — compact drifting nodes + active-node readout (cards move now)

Same file, same section only (`WhatIDoSection.tsx`). This reverses the
earlier "cards stay, diagram moves" decision per user request: the five
panels are now compact nodes in continuous drift, with one shared readout
for the detail text.

Card sizing: before — full panels (`p-6`/`p-8`, 44px icon tile, title +
full blurb + hover arrow, ~200-300px tall). After — compact nodes
(`px-4 py-3`, `rounded-xl`, 36px icon tile, 13px title, status pip):
240px-capped on desktop (`sm:max-w-[240px]`, hub `sm:min-w-[300px]`
centered on its own row), full-width rows on mobile. Each node shows icon
+ title only.

Topology: hub-and-spoke constellation, restaged not reinvented. Hub (card
0) centered on the top row; four nodes 2x2 below with the right column
staggered down (`sm:mt-12` margin, never transform) to break grid rigidity.
Normal flow is kept deliberately: it preserves tab/reading order, keeps
the layout responsive without absolute positioning, and keeps the
offsetParent-walk measurement valid — the network read comes from node
scale + drift + links, not from exotic placement that could overlap.

Blurbs: one persistent readout below the field (`ACTIVE NODE — 0X` +
title + blurb, `min-h-[132px]` so it never jumps). Nodes are real
`<button>`s in DOM order: hover, focus, and click/Enter all set the active
node, so the text is never hover-only. The readout region is
`aria-live="polite"`, and with `prefers-reduced-motion` everything is
static but fully reachable by keyboard — full information, no motion
required.

Single source of truth: the per-frame sim owns one delta per node. Each
frame writes that delta to BOTH the card (plain inner `span` style
transform) and its connector endpoint (port-dot `g` transform + rebuilt
branch/trunk `d`), so a line can never detach. Base anchors are still
measured once via the offsetParent walk (transform-independent, still
correct for rest state); drift applies purely as delta. Resize/MQ/fonts
re-measure anchors without touching the running sim offsets.

Framer conflict avoided: the outer `motion.button` carries only layout
classes and the one-time reveal transform; ALL visual chrome (glass,
border, padding) lives on the plain inner `span` that the loop translates
via ref — framer never owns that element, so no reset on re-render
(`active` changes re-render freely). Zero React state per frame; the loop,
stoppability, IO/visibility gating, and `[reduceMotion, geom]` deps are
unchanged from the previous pass.

Motion constants (reasoned, not eye-tuned): rest radius 7px, pointer pull
18px max with σ=170px falloff, per-axis clamp ±14px, active node damped to
35% so it stays near its focus ring and the readout stays stable. Non-
overlap proof: minimum gap is 32px (`gap-8` both axes, stagger only adds
separation); worst-case mutual approach is 14+14=28px < 32px, so cards can
never touch at `sm` and up. Below `sm` there is no loop and no layer —
static compact rows. Dots ride the cards now (no independent dot sim);
trunk top follows the hub port each frame.

Verified: `npx tsc --noEmit` clean. Not verifiable without a browser, and
the motion balance is reasoned only: drift calmness vs visibility at the
new constants, branch diagonals at full pull, LED/readout feel, and
whether the 240px nodes + readout rhythm reads as constellation or sparse
at 1440px.

### Correction after review: hover-driven aria-live

The active-node readout was marked `aria-live="polite"`, but its content
tracks `active`, which is set by `onMouseEnter` as well as focus and click.
`polite` queues rather than interrupts, so a screen reader user sweeping
the pointer across the five nodes accumulates one queued announcement per
node instead of hearing the latest. Hover must not drive a live region.

The readout is now visual-only, and the accessible copy moved to the
mechanism that does not have this problem: every blurb lives in an
`sr-only` list with a stable `svc-blurb-{i}` id, and each node button
carries `aria-describedby="svc-blurb-{i}"`. All five blurbs are therefore
always in the DOM and read on focus, independent of which node is active.
No visual change; the readout renders exactly as before.

Verified: `npx tsc --noEmit` clean; the five `aria-describedby` refs
resolve against the five generated ids; no `aria-live` remains.

One content tradeoff to be aware of, not a defect: a sighted visitor who
never hovers or focuses a node sees only node 0's blurb, because the
blurbs now live in the readout rather than on the cards. That follows from
making the cards compact, and the nodes are now `<button>`s, so a single
click reveals the rest.

---

# CV RECONCILIATION PASS — education section, training retitle, renumber

Presentation layer only; `src/data/site.ts` content untouched.

New `src/components/sections/EducationSection.tsx` (`#education`,
`scroll-mt-24`, wired between Skills and Experience in `home/page.tsx`).
Structure: `SectionHeader [06]` (BACKGROUND / EDUCATION / "Formal study
and working languages.") -> two-row ledger -> languages strip. The
diploma leads inside a corner-bracket frame (period in primary, 2xl/3xl
display qualification, org · speciality, outcome `note` on a primary pip,
subject chips in the Skills chip treatment); the baccalaureate is a
subordinate hairline ledger row (smaller type, period + note right-
aligned, no chips — its `subjects` is empty and renders nothing by guard).
Ledger chosen over equal cards because the entries are hierarchy, not
peers: one terminal degree versus one prior diploma. Languages is a
compact 3-column strip under a hairline rule with its own mini-label, not
a section. Rhythm `py-20 sm:py-24` sits between tight Skills and generous
Experience.

Retitle: awards header is now eyebrow "COURSES ATTENDED" / title
"TRAINING" / sub "Three courses and one CTF placement on the registry
press. Select a record to change the sheet — drag it to turn." Press,
list, selection logic, tablist wiring and aria left byte-identical;
`#awards` anchor kept. Residue deliberately not touched: the tablist
`aria-label="Credentials"` and the baked parchment boilerplate still say
certificate — both live under the exact-fidelity rule / data layer.

Renumber: 02 services, 03 projects, 04 training, 05 skills, 06 education
(new), 07 experience (was 06), contact hardcoded bracket 07 -> 08.

Fourth project: no change needed. The rows alternate on `i % 2`, so four
entries fall into a clean 2+2 zigzag with ghost numerals 01-04 and no
orphan; the last row is a flipped row (numeral left), same as the old
row 3.

Nav fit: the desktop row could not fit 7 tracked-out labels + full brand
+ CTA below ~1500px (0.28em tracking ≈ 11px/char uppercase; ≈1550px
needed vs 944px available at lg), so it was already overflowing at six
items. Fixed by moving the desktop row (links, 3-col grid, HIRE ME) from
`lg` to `xl`, tightening links `gap-7` -> `gap-5`, and showing the brand
role suffix only below `xl` (`hidden sm:inline xl:hidden`). Result: 320 /
375 / 768 / 1024 hamburger + short-or-suffixed brand, no competition, no
overflow; 1280 ≈ 1130px needed vs 1200 available, fits; 1440 comfortable.
Mobile sheet takes 7 rows vertically, unchanged pattern.

Phone: placed, not skipped. New PHONE row between EMAIL and LOCATION in
the DETAILS card, identical tile/label/link treatment with a `tel:` link
(spaces stripped). Required one new Lucide `phone` path in `icons.tsx` —
presentation asset, no token/dep/content change. The card absorbs a third
row without strain.

Verified: `npx tsc --noEmit` clean.

## Content reconciliation against the owner's CV (2026-09-29)

The owner supplied their CV; `src/data/site.ts` was reconciled against it.
Everything newly added is a direct transcription, not an inference.

Added: `site.education` (ISET de Gabès higher technician diploma 2023–2026,
Network Security, graduated June 2026, four subjects; and the 2024 technical
baccalaureate, Mention Assez bien); `site.languages` (Arabic native, French
intermediate/professional, English technical); `site.contact.phone`
(+216 28 400 598); a fourth project, "Network Scan Web Interface" (Nmap
driven through a web interface to surface potential vulnerabilities);
HTML5 and CSS3 in Development; internship durations on all three roles
("· 4 months", "· 1 month", "· 1 month").

Corrected: `awards[3]` said "Blue Track" — the CV says **Blue Team**. The
CV lists "pare-feu" and Wi-Fi under Networking, so both moved there from
"Cloud & Security Basics".

Deliberate honesty changes, agreed with the owner. The CV says
« Formations : CCNA 1, AWS Cloud Foundations, Introduction to Cybersecurity »
— courses attended, not certifications awarded, and AWS only as « notions ».
So the section is now TRAINING / "COURSES ATTENDED", the hero stat is
"NETWORK COURSES" not "NETWORK CERTS", and the blurbs were reworded to
"Course completed —" and, for AWS, "Introductory coverage —". The CTF is
the one attested result and is stated as such. The 3D press, its selection
logic and its a11y were not touched; only the header copy and the
`aria-label` (was "Credentials", now "Training records").

Owner decision: **hide the year for the three courses.** The CV dates only
the CTF (2025) and gives no year for CCNA 1, AWS Cloud Foundations or
Introduction to Cybersecurity, so those three now carry no date at all
rather than an unsourced 2025. `Certificate.year` became optional.

Consequences, all data-driven so the design is untouched:
- `toPaperData` emits `AWARDED · <year>` only when a year exists, otherwise
  `COURSE COMPLETED`. So the word "AWARDED" can only ever appear on a sheet
  that carries a confirmed date — currently the CTF, the one attested result.
- The big serif year line at y=1534 is now drawn only when `year` is present,
  so the three course faces drop it and the ornament closes the gap.
- The registry list shows a `COURSE` tag in place of the year.
- The `awards` fallback in `getCertificates()` propagates `year` only when the
  key is present, so it cannot reintroduce a fabricated date.

Verified: `npx tsc --noEmit` clean, `npx next build` clean.

Still open: if the owner later supplies the real years for those three, add
`year` back to the relevant entries and both the parchment and the list will
pick it up with no further code change.

Also unresolved: `paperArt.ts` still bakes the phrase "is hereby awarded to"
into the certificate face, which now contradicts "courses attended". That
file is a verified port, so it was not touched; the owner should decide
whether the parchment wording is re-cut.

Note: `site.awards` is NOT dead data. It is the fallback branch of
`getCertificates()` (`certificates.ts:15`), which runs when the
`certificates` array is empty. Do not remove it.

---

# EDUCATION — languages as qualitative gauges

The 3-column languages strip is now ONE stacked readout block in
`EducationSection` (ledger above untouched, header/`#education` untouched).
Each language is a row: label + verbatim CV level wording on top, then a
full-width hairline track (`h-px bg-hairline`) with a `primary` fill bar
(`h-[3px]`, vertically centered, rounded) — an instrument-channel read,
not a progress widget: no ticks, no scale, no number anywhere.

Honesty: fills are coarse and declared, derived from the CV wording only —
Arabic "Native language" -> 1 (full track), French "Intermediate ·
professional use" -> 0.6 (clearly partial), English "Technical · reading
documentation" -> 0.4 (visibly lower than French). Tenths, not a measured
scale. Authorized data change: one visual-only `meter` field added per
`site.languages` entry so the fill is explicit in data rather than
string-matched at render; `label`/`level` wording verbatim. Qualitative
cue: a muted "QUALITATIVE — AS DECLARED" tag sits opposite the LANGUAGES
mini-label, so the bars never pose as instrument readings.

A11y: each bar is `aria-hidden`; the level word stays in the DOM ("Arabic —
Native language" etc.), so text readers get everything and the bar adds
nothing. No value is written anywhere, numeric or otherwise.

Motion: one-time fill via `whileInView` width animation (0.9s, staggered
0.15/row, site ease); `useReducedMotion` passes `initial={false}` so it
jumps to final fill. Single column at every width, three compact rows —
no rhythm change, no breakpoint risk at 320 / 375 / 768 / 1024 / 1440.

Verified: `npx tsc --noEmit` clean.

---

# HEADERS — numbered-eyebrow band removed everywhere

Owner request; `SectionHeader` props DROPPED (not optional): `index` and
`eyebrow` are gone from the signature and all 6 call sites (services,
projects, training, skills, education, experience). No dead or
conditionally-rendered props left. Removed with them: the green
`[02]`–`[07]` numerals, the short hairlines, and the eyebrow words
(CAPABILITIES, SELECTED WORK, COURSES ATTENDED, TOOLKIT, BACKGROUND,
TRACK RECORD). Hero lost its hand-rolled `[01]` + eyebrow pill badge;
Contact lost its mirrored `[08]` + GET IN TOUCH + hairline band. Kept:
every `<h1>`/`<h2>` title and every `sub` paragraph, unchanged.

Rhythm preservation (the point of the numbers): the band occupied ~20px
plus the h2's `mt-4` (16px) = 36px above each title. The shared header
wrapper keeps `mb-12 sm:mb-14` and gains `pt-9` (36px), the h2's `mt-4`
is deleted — so every title sits exactly where it did, just without the
band. Same treatment on Contact's right column (`pt-9` on its Reveal,
h2 `mt-4` deleted) and the hero copy column (`pt-14` ≈ badge row 29px +
h1 `mt-6` 24px; h1 `mt-6` deleted, 3px over, invisible). Nothing else in
any section moved; no wall of text.

`site.eyebrow` is now unrendered; the field stays in `site.ts` untouched
per instruction. Anchors, ids, scroll-mt, network animation, press,
tokens: all untouched.

Verified: `npx tsc --noEmit` clean.

---

# SCROLL REVEAL — the `once: true` delivery race

Not a viewport-margin problem. Tightening `whileInView` margins (80 → 120 →
`amount`) was the wrong lever and made the reveal *more* eager while leaving
the actual failure mode intact: on a heavy section the IntersectionObserver
can deliver its callback and the `whileInView` commit in the same frame the
node is already in view, so the observer fires, Framer Motion advances past
its start point, `once` closes the gate — and the element is left parked
mid-animation at a fractional opacity instead of filling in. Fast scrolling
through the SVG network and the language bars reproduced it most reliably;
those two sections carry the heaviest per-frame work.

`Reveal.tsx` now owns `useRevealOnScroll`, which ignores intersection state
entirely and compares a monotonic scroll position against the element's
document offset:

- `scrollY` is sampled once per rAF tick and never derived from rects, so
  the value cannot oscillate the way `getBoundingClientRect().top` does when
  a transform is mid-flight on an ancestor;
- the target threshold is measured in document coordinates (`offsetTop` plus
  the offset parent's scroll chain), which is stable across the animation;
- the gate latches open on the first tick that satisfies the threshold and
  stays open, replacing `once` with an explicit monotonic boolean;
- resize re-measures the target and keeps the current revealed state rather
  than re-arming the animation.

The visual contract is unchanged and deliberately so: opacity + `y`
translation, ~0.7s, ease `[0.21, 0.47, 0.32, 0.98]`, and `RevealGroup`'s
per-child stagger are all preserved. This swaps *when the trigger fires*, not
how anything looks or how long it takes. `useReducedMotion` still sets
`initial={false}` so reduced-motion visitors get the settled state on first
paint rather than an animation.

Applied to `WhatIDoSection`'s RSVP network group and `EducationSection`'s
`LanguageBar`. `HeroSection` deliberately still uses `whileInView` — it is
visible at first paint, so there is no scroll race to fix there.

Verified: `npx tsc --noEmit` clean. 5 hostile runs at 900px jumps with a
140ms settle (the timing that used to strand elements) → `stuck=0` every run.
Sampled mid-transition opacities are fractional and all sections reach
`opacity: 1` within 2s. Deep link `/home#contact` lands with every section
revealed. Reduced-motion: 7/7 sections at `opacity: 1` with no residual
transform.

Note the reduced-motion check must assert a section count. An earlier version
of the harness ran `.every()` over an empty `querySelectorAll` list against a
dead dev server and reported a false pass; the assertion now fails closed.

Known and untouched: a pre-existing hydration mismatch in
`KineticButton.tsx` (server renders `opacity:0; scale(0.92)`, reduced-motion
client renders `opacity:0`). Pre-existing, unrelated to this change, and left
alone pending the owner's call — altering its initial styles would change the
verified button entrance animation.
