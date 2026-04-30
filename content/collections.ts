import type { Collection } from "@/types/content";

export const collections: Collection[] = [
  {
    id: "wildlife",
    title: { no: "Wildlife", en: "Wildlife" },
    description: {
      no: "Dyr i sin naturlige habitat — fra norsk skog til afrikansk savanne.",
      en: "Animals in their natural habitat — from Norwegian forests to African savanna.",
    },
    coverImage: "/images/photos/wildlife/roe-deer-01.jpg",
    order: 1,
  },
  {
    id: "nature",
    title: { no: "Nature", en: "Nature" },
    description: {
      no: "Landskap, lys og natur uten mennesker i bildet.",
      en: "Landscapes, light and nature without people in the frame.",
    },
    coverImage: "/images/photos/wildlife/european-golden-plover-01.jpg",
    order: 2,
  },
  {
    id: "other",
    title: { no: "Other", en: "Other" },
    description: {
      no: "Bilder som ikke passer i de andre kategoriene.",
      en: "Images that don't fit neatly into the other categories.",
    },
    coverImage: "/images/photos/wildlife/atlantic-puffin-01.jpg",
    order: 3,
  },
];

export function getCollections(): Collection[] {
  return [...collections].sort((a, b) => a.order - b.order);
}

export function getCollection(id: string): Collection | null {
  return collections.find((c) => c.id === id) ?? null;
}
