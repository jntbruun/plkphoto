import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import { getCollections } from "@/content/collections";
import { getPhotos } from "@/content/images";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });
  return { title: t("heading") };
}

export default async function PortfolioPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale as Locale;
  const collections = getCollections();
  const photoCountsByCollection = Object.fromEntries(
    await Promise.all(
      collections.map(async (c) => [c.id, (await getPhotos({ collection: c.id })).length] as const),
    ),
  ) as Record<string, number>;

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <h1 className="font-display text-5xl md:text-7xl font-light mb-16 md:mb-24">Portfolio</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {collections.map((collection) => {
            const photoCount = photoCountsByCollection[collection.id] ?? 0;
            return (
              <CollectionCard
                key={collection.id}
                id={collection.id}
                title={collection.title[l]}
                description={collection.description[l]}
                coverImage={collection.coverImage}
                photoCount={photoCount}
                locale={l}
              />
            );
          })}
        </div>
      </Container>
    </div>
  );
}

function CollectionCard({
  id,
  title,
  description,
  coverImage,
  photoCount,
  locale,
}: {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  photoCount: number;
  locale: Locale;
}) {
  const countLabel = locale === "no" ? `${photoCount} bilder` : `${photoCount} images`;

  return (
    <Link
      href={`/portfolio/${id}`}
      className="group block"
      aria-label={title}
    >
      <div className="relative overflow-hidden aspect-[4/5] mb-4">
        <Image
          src={coverImage}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02]"
        />
      </div>
      <div>
        <h2 className="font-display text-2xl font-light group-hover:opacity-70 transition-opacity">
          {title}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">{countLabel}</p>
        <p className="text-sm text-[var(--color-muted)] mt-2 line-clamp-2">{description}</p>
      </div>
    </Link>
  );
}
