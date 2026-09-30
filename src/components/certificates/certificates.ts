import { site, certificates as canonical } from "@/data/site";
import type { Certificate } from "@/data/site";
import type { IconName } from "@/components/icons";

export type { Certificate };

/**
 * Canonical data when the sibling's `site.certificates` is present (it is —
 * four slugs: ccna-1, aws-cloud-foundations, intro-cybersecurity,
 * ctf-blue-team). The awards-derived fallback below only ever runs if that
 * array is emptied, so the section still renders something honest.
 */
export function getCertificates(): Certificate[] {
  if (Array.isArray(canonical) && canonical.length > 0) return canonical;
  return site.awards.map((award) => ({
    slug: award.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, ""),
    title: award.title,
    fullTitle: award.title,
    issuer: "Issuing Academy",
    // Only the CTF carries a confirmed year; the three courses have none, and
    // this fallback must not invent one.
    ...("year" in award ? { year: award.year as string } : {}),
    focus: ["Networking", "Security", "Defense"],
    blurb: award.blurb,
    icon: award.icon as IconName,
  }));
}
