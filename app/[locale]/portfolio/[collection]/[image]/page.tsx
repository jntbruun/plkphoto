import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Container from "@/components/layout/Container";
import { Link } from "@/lib/navigation";
import ImageNavigation from "@/components/gallery/ImageNavigation";
import { getCollection } from "@/content/collections";
import { getPhotos, getPhoto } from "@/content/images";
import type { CollectionId, Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string; collection: string; image: string }>;
}

export async function generateStaticParams() {
  const collections: CollectionId[] = ["wildlife", "nature", "other"];
  const paths: { collection: string; image: string }[] = [];
  for (const col of collections) {
    const photos = getPhotos({ collection: col });
    photos.forEach((p) => paths.push({ collection: col, image: p.slug }));
  }
  return paths;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, image: imageSlug } = await params;
  const photo = getPhoto(imageSlug);
  if (!photo) return {};
  const l = locale as Locale;
  return {
    title: photo.title[l],
    openGraph: { images: [{ url: photo.src }] },
  };
}

export default async function ImagePage({ params }: PageProps) {
  const { locale, collection: collectionSlug, image: imageSlug } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  const photo = getPhoto(imageSlug);
  const collection = getCollection(collectionSlug);
  if (!photo || !collection) notFound();

  // Build prev/next within collection
  const collectionPhotos = getPhotos({ collection: collectionSlug as CollectionId });
  const currentIndex = collectionPhotos.findIndex((p) => p.slug === imageSlug);
  const prevPhoto = currentIndex > 0 ? collectionPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < collectionPhotos.length - 1 ? collectionPhotos[currentIndex + 1] : null;

  const formattedDate = new Date(photo.date).toLocaleDateString(
    l === "no" ? "nb-NO" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="pt-24 md:pt-28 pb-24">
      {/* Back link */}
      <Container>
        <nav className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-8" aria-label="Breadcrumb">
          <Link href="/portfolio" className="hover:text-[var(--color-fg)] transition-colors">
            Portfolio
          </Link>
          <span>/</span>
          <Link
            href={`/portfolio/${collectionSlug}`}
            className="hover:text-[var(--color-fg)] transition-colors"
          >
            {collection.title[l]}
          </Link>
          <span>/</span>
          <span className="text-[var(--color-fg)]">{photo.title[l]}</span>
        </nav>
      </Container>

      {/* Full-width image */}
      <div className="w-full flex justify-center px-4 md:px-8 lg:px-12 mb-8">
        <div className="relative w-full max-w-5xl">
          <Image
            src={photo.src}
            alt={photo.alt[l]}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 1280px) 100vw, 1280px"
            placeholder="blur"
            blurDataURL={photo.blurDataURL}
            priority
            className="w-full h-auto"
            style={{ display: "block" }}
          />
        </div>
      </div>

      {/* Metadata + navigation */}
      <Container>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 max-w-5xl mx-auto">
          {/* Left: title + details */}
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-light mb-4">
              {photo.title[l]}
            </h1>
            <dl className="flex flex-col gap-2 text-sm text-[var(--color-muted)]">
              <div className="flex gap-3">
                <dt>{t("location")}:</dt>
                <dd className="text-[var(--color-fg)]">{photo.location[l]}</dd>
              </div>
              <div className="flex gap-3">
                <dt>{t("date")}:</dt>
                <dd className="text-[var(--color-fg)]">{formattedDate}</dd>
              </div>
            </dl>
            {photo.description && (
              <p className="mt-6 text-sm leading-relaxed max-w-md text-[var(--color-muted)]">
                {photo.description[l]}
              </p>
            )}
            {photo.availableAsPrint && (
              <Link
                href={`/contact?print=${photo.slug}`}
                className="inline-block mt-6 text-sm border-b border-[var(--color-fg)] pb-0.5 hover:opacity-60 transition-opacity"
              >
                {t("requestPrint")} →
              </Link>
            )}
          </div>

          {/* Right: prev/next */}
          <ImageNavigation
            prevSlug={prevPhoto?.slug ?? null}
            nextSlug={nextPhoto?.slug ?? null}
            prevTitle={prevPhoto?.title[l] ?? null}
            nextTitle={nextPhoto?.title[l] ?? null}
            collectionSlug={collectionSlug}
            prevLabel={t("previous")}
            nextLabel={t("next")}
          />
        </div>
      </Container>
    </div>
  );
}
