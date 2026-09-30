import { EB_Garamond, Inter_Tight } from "next/font/google";

/**
 * These two faces exist specifically for the 3D certificate route
 * (/certificates), which rasterises its typography into a canvas texture.
 *
 * A canvas texture is a one-way door: whatever face is active at draw time is
 * baked permanently into the bitmap, and re-rendering only happens on a
 * certificate switch. So the certificate renderer must await
 * `document.fonts.load()` for these families before it draws anything.
 *
 * next/font hashes the real family names into the CSS variables below. Read
 * them off documentElement at runtime rather than hardcoding "EB Garamond",
 * which will not resolve.
 */

export const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});
