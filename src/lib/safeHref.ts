/**
 * Outbound-link allowlist.
 *
 * The site is static and its content is compile-time TypeScript, so nothing
 * here stops an attack today. It exists so the guarantee survives the obvious
 * future change: making `site.ts` dynamic (CMS, API, JSON fetch). The moment
 * `social.href` can be influenced by anything outside this repo, an unchecked
 * value in `href` is a live `javascript:` execution primitive.
 *
 * The normalisation below carries the weight. A naive `startsWith("javascript:")`
 * test is bypassed by `" javascript:"`, `java<TAB>script:`, `java<LF>script:` and
 * `JaVaScRiPt:` — browsers ignore control characters and zero-width codepoints
 * while parsing the scheme. So those are stripped *before* the scheme is read,
 * and the scheme is compared case-insensitively.
 */

const LINKEDIN_HOST = "linkedin.com";

/** Conservative: no display-name, no recipient list, no whitespace. */
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/** Optional leading `+`, then digits. Blocks letters, spaces and `;`/`?`. */
const TELEPHONE = /^\+?[0-9]+$/;

const SCHEME = /^([A-Za-z][A-Za-z0-9+.-]*):([\s\S]*)$/;

/**
 * True for characters the URL parser skips over: ASCII control codes
 * (0x00-0x20, incl. tab/CR/LF, and 0x7F), plus the zero-width range
 * U+200B-U+200D and the byte-order mark U+FEFF.
 *
 * Written as code-point arithmetic rather than a character-class literal so the
 * source file stays plain ASCII — a literal NUL in the pattern makes the file
 * read as binary and breaks diffs.
 */
function isInvisible(code: number): boolean {
  if (code <= 0x20) return true;
  if (code === 0x7f) return true;
  if (code >= 0x200b && code <= 0x200d) return true;
  if (code === 0xfeff) return true;
  return false;
}

function stripInvisible(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0);
    if (code === undefined || !isInvisible(code)) out += ch;
  }
  return out;
}

/**
 * Returns the cleaned href when it points at a permitted destination, or null
 * when it must not be rendered as a link.
 */
export function safeHref(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  // Collapse `" java<TAB>script:x"` to `"javascript:x"` before any check runs,
  // so it is rejected instead of sailing through a prefix comparison.
  const clean = stripInvisible(raw);
  if (!clean) return null;

  // In-page fragment. Cannot execute script.
  if (clean.startsWith("#")) return clean;

  // Browsers normalise backslash to forward slash in URL position, so
  // `/\evil.com` is protocol-relative just like `//evil.com`.
  const normalized = clean.replace(/\\/g, "/");

  // Same-origin path such as `/cv_emploi.pdf`. `//` is protocol-relative.
  if (normalized.startsWith("/")) {
    return normalized.startsWith("//") ? null : clean;
  }

  const match = SCHEME.exec(normalized);
  if (!match) return null;

  const scheme = match[1].toLowerCase();
  const rest = match[2];

  if (scheme === "https") {
    let host: string;
    try {
      // Parse the cleaned value; `URL` throws on anything malformed.
      host = new URL(clean).hostname.toLowerCase();
    } catch {
      return null;
    }
    return host === LINKEDIN_HOST || host.endsWith("." + LINKEDIN_HOST) ? clean : null;
  }

  if (scheme === "mailto") {
    // Address is everything before the first `?`; the rest is subject.
    const address = rest.split("?")[0];
    return EMAIL.test(address) ? clean : null;
  }

  if (scheme === "tel") {
    return TELEPHONE.test(rest) ? clean : null;
  }

  // Everything else — javascript, data, vbscript, file, blob, ftp, intent,
  // about, plain http — is refused.
  return null;
}