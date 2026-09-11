/** Photo folders (both the CLI import script's local folders and the admin
 * bulk-import tool's browser-selected folders) name files like "1.webp",
 * "2.jpg", ... "11.png" — a bare name with no numeric suffix sorts first
 * (it's the primary/cover shot), and everything else sorts by that number
 * rather than alphabetically, so "2.jpg" comes before "10.jpg" instead of
 * after. Shared so both places order photos identically.
 *
 * IMPORTANT for whoever is naming the actual photo files: this only works
 * if you rename them yourself. A phone or camera's default filenames
 * (IMG_1234.jpg, a timestamp, etc.) still have a trailing number, so they
 * still sort — just by whatever number the camera happened to assign, which
 * is usually the order the photos were taken/downloaded in, NOT necessarily
 * the order you'd want them to display in. If the shot you want as the cover
 * photo wasn't the first one taken, it will NOT automatically end up first
 * just because you picked it as "the main one" — rename it (e.g. to
 * "1.jpg", or drop the number entirely) so its filename actually sorts
 * first. See product-intake-instructions.md's "Naming your photos" section.
 */
export function imageOrderKey(filename: string): number {
  const match = filename.match(/(\d+)\.\w+$/);
  return match ? parseInt(match[1], 10) : -1;
}

/** Numeric-aware alphabetical tiebreak for files whose `imageOrderKey()` is
 * equal (most commonly: two or more files with no trailing-number-before-
 * extension, which all get -1). Without this, ties fall back to whatever
 * order the browser's folder picker or the filesystem happened to hand the
 * files over in — not something we control or can guarantee, and not
 * necessarily the order the person expects. Comparing the full filename
 * this way instead gives a fixed, predictable order in every browser and on
 * every OS: "img2.jpg" before "img10.jpg" (unlike plain string comparison,
 * where "10" sorts before "2"). */
function naturalCompare(a: string, b: string): number {
  const tokenize = (s: string) => s.match(/\d+|\D+/g) ?? [];
  const aParts = tokenize(a);
  const bParts = tokenize(b);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const ap = aParts[i];
    const bp = bParts[i];
    if (ap === undefined) return -1;
    if (bp === undefined) return 1;
    const aIsNum = /^\d+$/.test(ap);
    const bIsNum = /^\d+$/.test(bp);
    if (aIsNum && bIsNum) {
      const diff = parseInt(ap, 10) - parseInt(bp, 10);
      if (diff !== 0) return diff;
    } else if (ap !== bp) {
      return ap < bp ? -1 : 1;
    }
  }
  return 0;
}

export function sortByImageOrder<T>(items: T[], nameOf: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const diff = imageOrderKey(nameOf(a)) - imageOrderKey(nameOf(b));
    return diff !== 0 ? diff : naturalCompare(nameOf(a), nameOf(b));
  });
}
