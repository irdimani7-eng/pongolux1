/** Photo folders (both the CLI import script's local folders and the admin
 * bulk-import tool's browser-selected folders) name files like "1.webp",
 * "2.jpg", ... "11.png" — a bare name with no numeric suffix sorts first
 * (it's the primary/cover shot), and everything else sorts by that number
 * rather than alphabetically, so "2.jpg" comes before "10.jpg" instead of
 * after. Shared so both places order photos identically. */
export function imageOrderKey(filename: string): number {
  const match = filename.match(/(\d+)\.\w+$/);
  return match ? parseInt(match[1], 10) : -1;
}

export function sortByImageOrder<T>(items: T[], nameOf: (item: T) => string): T[] {
  return [...items].sort((a, b) => imageOrderKey(nameOf(a)) - imageOrderKey(nameOf(b)));
}
