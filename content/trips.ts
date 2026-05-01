import type { Trip } from "@/types/content";

export const trips: Trip[] = [
  {
    slug: "hello-fra-feltet",
    title: {
      no: "Hello fra feltet",
      en: "Hello from the field",
    },
    excerpt: {
      no: "Hva skjer egentlig når du venter i timevis på det perfekte bildet? Et innblikk i hva det vil si å fotografere natur på norsk.",
      en: "What actually happens when you wait for hours for the perfect shot? A look into what it means to photograph nature the Norwegian way.",
    },
    coverImage: "/images/photos/wildlife/eurasian-bullfinch-01.jpg",
    publishedAt: "2024-01-15",
    readingMinutes: 4,
  },
];

export function getTrips(): Trip[] {
  return [...trips].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getTrip(slug: string): Trip | null {
  return trips.find((p) => p.slug === slug) ?? null;
}
