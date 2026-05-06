import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import HeroCarousel from "@/components/carousel/HeroCarousel";
import { getFeaturedPhotos, getPhotos } from "@/content/images";
import { getCollections } from "@/content/collections";
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

  const featuredPhotos = await getFeaturedPhotos();
  const collections = getCollections();
  const photoCountsByCollection = Object.fromEntries(
    await Promise.all(
      collections.map(async (c) => [c.id, (await getPhotos({ collection: c.id })).length] as const),
    ),
  ) as Record<string, number>;
  const localePrefix = locale !== "no" ? `/${locale}` : "";

  return (
    <>
      {/* 1. Hero — full-screen rotating image with massive white logo */}
      <HeroCarousel
        photos={featuredPhotos}
        locale={l}
        cta={t("cta")}
        ctaHref={`${localePrefix}/portfolio`}
      />

      {/* 2. About PLK Photo */}
      <Container as="section" className="py-24 md:py-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-start">
          <p className="md:col-span-3 font-display text-xs tracking-[0.25em] uppercase text-[var(--color-muted)]">
            {t("aboutHeading")}
          </p>
          <div className="md:col-span-9 max-w-[58ch]">
            <p className="font-display text-2xl md:text-4xl font-bold tracking-[0.01em] uppercase leading-[1.05]">
              {t("intro")}
            </p>
            <p className="mt-8 text-base text-[var(--color-muted)] leading-relaxed">
              {t("aboutBody")}
            </p>
            <Link
              href="/about"
              className="font-display tracking-[0.15em] uppercase inline-block mt-10 text-xs border-b border-[var(--color-fg)] pb-0.5 hover:opacity-60 transition-opacity"
            >
              {t("aboutCta")} →
            </Link>
          </div>
        </div>
      </Container>

      {/* 3. Portfolio — collection links */}
      <section className="py-20 md:py-28 border-t border-[var(--color-line)]">
        <Container>
          <div className="flex items-end justify-between mb-12 md:mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[0.02em] uppercase">
              {t("portfolioHeading")}
            </h2>
            <Link
              href="/portfolio"
              className="font-display tracking-[0.15em] uppercase text-xs hover:opacity-60 transition-opacity hidden md:inline"
            >
              {t("cta")} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {collections.map((collection) => {
              const photoCount = photoCountsByCollection[collection.id] ?? 0;
              const isEmpty = photoCount === 0;
              const content = (
                <>
                  <div className="relative overflow-hidden aspect-[4/5] mb-4 bg-[var(--color-line)]">
                    {!isEmpty ? (
                      <Image
                        src={collection.coverImage}
                        alt={collection.title[l]}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-[var(--color-muted)] text-xs tracking-[0.2em] uppercase">
                        {locale === "no" ? "Kommer snart" : "Coming soon"}
                      </div>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-[0.05em] uppercase group-hover:opacity-70 transition-opacity">
                    {collection.title[l]}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] mt-1">
                    {isEmpty
                      ? locale === "no"
                        ? "Kommer snart"
                        : "Coming soon"
                      : collT("imageCount", { count: photoCount })}
                  </p>
                </>
              );

              return isEmpty ? (
                <div key={collection.id} className="block opacity-60 cursor-not-allowed">
                  {content}
                </div>
              ) : (
                <Link
                  key={collection.id}
                  href={`/portfolio/${collection.id}`}
                  className="group block"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 4. Order prints — wall mockup */}
      <section className="py-20 md:py-28 border-t border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div className="order-2 md:order-1">
              <p className="font-display text-xs tracking-[0.25em] uppercase text-[var(--color-muted)] mb-4">
                {locale === "no" ? "Prints" : "Prints"}
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-[0.02em] uppercase leading-[1.05]">
                {t("printsHeading")}
              </h2>
              <p className="mt-6 text-base text-[var(--color-muted)] leading-relaxed max-w-md">
                {t("printsBody")}
              </p>
              <Link
                href="/shop"
                className="font-display tracking-[0.15em] uppercase inline-block mt-8 text-xs border-b border-[var(--color-fg)] pb-0.5 hover:opacity-60 transition-opacity"
              >
                {t("printsCta")} →
              </Link>
            </div>

            <div className="order-1 md:order-2 relative aspect-[4/3] bg-[var(--color-line)] overflow-hidden">
              {/* TODO: replace with Petter's actual wall photo at /images/wall.jpg */}
              <WallMockup locale={l} />
            </div>
          </div>
        </Container>
      </section>

    </>
  );
}

function WallMockup({ locale }: { locale: Locale }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#0E0E0E]" />
      {/* Faux print on wall */}
      <div className="relative w-1/2 aspect-[4/5] bg-[var(--color-bg)] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-[var(--color-line)]">
        <div className="absolute inset-3 bg-[#888] flex items-center justify-center text-[10px] tracking-[0.25em] uppercase text-[#444]">
          PLKPHOTO
        </div>
      </div>
      <p className="absolute bottom-3 right-3 text-[10px] tracking-[0.2em] uppercase text-[var(--color-muted)]">
        {locale === "no" ? "Plassholder" : "Placeholder"}
      </p>
    </div>
  );
}
