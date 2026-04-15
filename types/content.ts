export type Locale = "no" | "en";
export type LocalizedString = Record<Locale, string>;
export type CollectionId = "wildlife" | "nature" | "other";

export interface Collection {
  id: CollectionId;
  title: LocalizedString;
  description: LocalizedString;
  coverImage: string; // path in /public/images/covers/
  order: number;
}

export interface PhotoImage {
  slug: string;
  title: LocalizedString;
  location: LocalizedString;
  date: string; // ISO
  collection: CollectionId;
  src: string; // path in /public/images/photos/
  alt: LocalizedString;
  description?: LocalizedString;
  featuredOnHome: boolean;
  availableAsPrint: boolean;
  printSizes?: string[];
  wallMockup?: string;
  width: number;
  height: number;
  blurDataURL: string;
  /** 'placeholder' = Petter needs to confirm this metadata */
  metadataStatus?: "placeholder" | "confirmed";
}

export interface BlogPost {
  slug: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  coverImage: string;
  publishedAt: string;
  readingMinutes: number;
}
