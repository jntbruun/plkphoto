import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Container from "@/components/layout/Container";
import PhotoGrid from "@/components/gallery/PhotoGrid";
import { Link } from "@/lib/navigation";
import { getCollection } from "@/content/collections";
import { getPhotos } from "@/content/images";
import type { CollectionId, Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string; collection: string }>;
}

export async function generateStaticParams() {
  return [
    { collection: "wildlife" },
    { collection: "nature" },
    { collection: "other" },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, collection } = await params;
  const col = getCollection(collection);
  if (!col) return {};
  const l = locale as Locale;
  return { title: col.title[l] };
}

export default async function CollectionPage({ params }: PageProps) {
  const { locale, collection: collectionSlug } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  const collection = getCollection(collectionSlug);
  if (!collection) notFound();

  const photos = await getPhotos({ collection: collectionSlug as CollectionId });

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-10" aria-label="Breadcrumb">
          <Link href="/portfolio" className="hover:text-[var(--color-fg)] transition-colors">
            Portfolio
          </Link>
          <span>/</span>
          <span className="text-[var(--color-fg)]">{collection.title[l]}</span>
        </nav>

        <div className="mb-10 md:mb-16">
          <h1 className="font-display text-5xl md:text-7xl font-light mb-4">
            {collection.title[l]}
          </h1>
          <p className="text-[var(--color-muted)] max-w-xl">{collection.description[l]}</p>
          <p className="text-sm text-[var(--color-muted)] mt-2">
            {t("imageCount", { count: photos.length })}
          </p>
        </div>

        {photos.length === 0 ? (
          <div className="py-24 text-center text-[var(--color-muted)]">
            <p>
              {l === "no"
                ? "Ingen bilder enda. Kommer snart."
                : "No images yet. Coming soon."}
            </p>
          </div>
        ) : (
          <PhotoGrid photos={photos} locale={l} collectionId={collectionSlug} />
        )}
      </Container>
    </div>
  );
}
