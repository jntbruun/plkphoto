import type { Collection } from "@/types/content";

export const collections: Collection[] = [
  {
    id: "wildlife",
    title: { no: "Wildlife", en: "Wildlife" },
    description: {
      no: "Dyr i sin naturlige habitat — fra norsk skog til afrikansk savanne.",
      en: "Animals in their natural habitat — from Norwegian forests to African savanna.",
    },
    // Uses one of the wildlife images as cover
    coverImage: "/images/photos/wildlife/scandinavian-red-fox.jpg",
    order: 1,
  },
  {
    id: "nature",
    title: { no: "Nature", en: "Nature" },
    description: {
      no: "Landskap, lys og natur uten mennesker i bildet.",
      en: "Landscapes, light and nature without people in the frame.",
    },
    // TODO: Replace with actual Nature cover when Petter provides images
    coverImage: "/images/photos/wildlife/golden-plover.jpg",
    order: 2,
  },
  {
    id: "other",
    title: { no: "Other", en: "Other" },
    description: {
      no: "Bilder som ikke passer i de andre kategoriene.",
      en: "Images that don't fit neatly into the other categories.",
    },
    // TODO: Replace with actual Other cover when Petter provides images
    coverImage: "/images/photos/wildlife/atlantic-puffin.jpg",
    order: 3,
  },
];

export function getCollections(): Collection[] {
  return [...collections].sort((a, b) => a.order - b.order);
}

export function getCollection(id: string): Collection | null {
  return collections.find((c) => c.id === id) ?? null;
}
