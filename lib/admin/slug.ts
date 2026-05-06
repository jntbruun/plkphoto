/**
 * Slug helpers shared between the import-photos script and the admin upload
 * pipeline. The same canonicalization rules apply in both paths so a photo
 * uploaded via the UI lands on a slug consistent with what importPhotos would
 * have produced from the same species name.
 */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[æå]/g, "a")
    .replace(/ø/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface CanonicalSpecies {
  slugBase: string;
  enLabel: string;
}

export function canonicalSpecies(commonName: string): CanonicalSpecies {
  const lc = commonName.trim().toLowerCase();
  if (lc === "lion" || lc === "lioness") {
    return { slugBase: "lion", enLabel: "Lion" };
  }
  if (lc.startsWith("stoat")) {
    return { slugBase: "stoat", enLabel: "Stoat" };
  }
  if (lc === "eurasian red squirrel") {
    return { slugBase: "eurasian-red-squirrel", enLabel: "Eurasian Red Squirrel" };
  }
  return { slugBase: slugify(commonName), enLabel: commonName };
}

/**
 * Pick the next free `<base>-NN` slug given the set of slugs already in use.
 */
export function nextSlug(slugBase: string, existingSlugs: Iterable<string>): string {
  const used = new Set(existingSlugs);
  for (let n = 1; n < 1000; n++) {
    const candidate = `${slugBase}-${String(n).padStart(2, "0")}`;
    if (!used.has(candidate)) return candidate;
  }
  throw new Error(`Could not find free slug for base "${slugBase}" (gave up at 1000)`);
}
