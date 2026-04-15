import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import HeroCarousel from "@/components/carousel/HeroCarousel";
import { getFeaturedPhotos } from "@/content/images";
import { getCollections } from "@/content/collections";
import { getPhotos } from "@/content/images";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: "PLKPHOTO — Petter L. Krogstad",
    description: t("intro"),
  };
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: "home" });
  const collT = await getTranslations({ locale, namespace: "portfolio" });

  const featuredPhotos = getFeaturedPhotos();
  const collections = getCollections();

  return (
    <>
      {/* Hero */}
      <HeroCarousel
        photos={featuredPhotos}
        locale={l}
        cta={t("cta")}
        ctaHref={`/${locale !== "no" ? locale + "/" : ""}portfolio`}
      />

      {/* Intro section */}
      <Container as="section" className="py-24 md:py-40">
        <p className="font-display text-2xl md:text-4xl font-light max-w-[52ch] leading-relaxed">
          {t("intro")}
        </p>
        <div className="mt-10">
          <Link
            href="/portfolio"
            className="text-sm border-b border-[var(--color-fg)] pb-0.5 hover:opacity-60 transition-opacity"
          >
            {t("cta")} →
          </Link>
        </div>
      </Container>

      {/* Collections */}
      <section className="pb-24 md:pb-40">
        <Container>
          <h2 className="font-display text-3xl md:text-5xl font-light mb-12 md:mb-16">
            {t("collectionsHeading")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {collections.map((collection) => {
              const photoCount = getPhotos({ collection: collection.id }).length;
              return (
                <Link
                  key={collection.id}
                  href={`/portfolio/${collection.id}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden aspect-[4/5] mb-4">
                    <Image
                      src={collection.coverImage}
                      alt={collection.title[l]}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02]"
                    />
                  </div>
                  <h3 className="font-display text-xl font-light group-hover:opacity-70 transition-opacity">
                    {collection.title[l]}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] mt-1">
                    {collT("imageCount", { count: photoCount })}
                  </p>
                  <p className="text-sm text-[var(--color-muted)] mt-1 underline underline-offset-4 decoration-[var(--color-line)]">
                    {t("viewCollection")}
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
