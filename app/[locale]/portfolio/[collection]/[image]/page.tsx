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
    const photos = await getPhotos({ collection: col });
    photos.forEach((p) => paths.push({ collection: col, image: p.slug }));
  }
  return paths;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, image: imageSlug } = await params;
  const photo = await getPhoto(imageSlug);
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

  const photo = await getPhoto(imageSlug);
  const collection = getCollection(collectionSlug);
  if (!photo || !collection) notFound();

  const collectionPhotos = await getPhotos({ collection: collectionSlug as CollectionId });
  const currentIndex = collectionPhotos.findIndex((p) => p.slug === imageSlug);
  const prevPhoto = currentIndex > 0 ? collectionPhotos[currentIndex - 1] : null;
  const nextPhoto = currentIndex < collectionPhotos.length - 1 ? collectionPhotos[currentIndex + 1] : null;

  const year = photo.date.slice(0, 4);

  const otherLang: Locale = l === "no" ? "en" : "no";
  const otherTitle = photo.title[otherLang];

  return (
    <div className="pt-24 md:pt-28 pb-24">
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

      <div className="w-full flex justify-center px-4 md:px-8 lg:px-12 mb-10">
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

      <Container>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 max-w-5xl mx-auto">
          <div className="flex-1">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-[0.04em] uppercase mb-1">
              {photo.title[l]}
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              {otherTitle}
              {photo.latinName && (
                <>
                  {" · "}
                  <em className="not-italic italic">{photo.latinName}</em>
                </>
              )}
            </p>

            {photo.availableAsPrint && (
              <Link
                href={`/contact?print=${photo.slug}`}
                className="font-display tracking-[0.15em] uppercase inline-block mb-8 px-6 py-3 bg-[var(--color-fg)] text-[var(--color-bg)] text-xs hover:opacity-80 transition-opacity"
              >
                {t("requestPrint")} →
              </Link>
            )}

            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
              {photo.latinName && (
                <>
                  <dt className="text-[var(--color-muted)]">{t("latin")}</dt>
                  <dd className="text-[var(--color-fg)] italic">{photo.latinName}</dd>
                </>
              )}
              <dt className="text-[var(--color-muted)]">{t("location")}</dt>
              <dd className="text-[var(--color-fg)]">{photo.location[l]}</dd>

              <dt className="text-[var(--color-muted)]">{t("year")}</dt>
              <dd className="text-[var(--color-fg)]">{year}</dd>

              {photo.camera && (
                <>
                  <dt className="text-[var(--color-muted)]">{t("camera")}</dt>
                  <dd className="text-[var(--color-fg)]">{photo.camera}</dd>
                </>
              )}
              {photo.lens && (
                <>
                  <dt className="text-[var(--color-muted)]">{t("lens")}</dt>
                  <dd className="text-[var(--color-fg)]">{photo.lens}</dd>
                </>
              )}
            </dl>

            {photo.description && (
              <p className="mt-8 text-sm leading-relaxed max-w-md text-[var(--color-muted)]">
                {photo.description[l]}
              </p>
            )}
          </div>

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
