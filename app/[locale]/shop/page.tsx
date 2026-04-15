import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import { getPrintablePhotos } from "@/content/images";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "shop" });
  return { title: t("heading") };
}

export default async function ShopPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: "shop" });

  const prints = getPrintablePhotos();

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <div className="mb-16 md:mb-24 max-w-xl">
          <h1 className="font-display text-5xl md:text-7xl font-light mb-6">{t("heading")}</h1>
          <p className="text-[var(--color-muted)] leading-relaxed">{t("intro")}</p>
        </div>

        {prints.length === 0 ? (
          <p className="text-[var(--color-muted)]">
            {l === "no" ? "Ingen prints tilgjengelig enda." : "No prints available yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mb-24">
            {prints.map((photo) => (
              <div key={photo.slug} className="group">
                {/* Photo */}
                <div className="relative overflow-hidden aspect-[4/3] mb-4">
                  <Image
                    src={photo.src}
                    alt={photo.alt[l]}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL={photo.blurDataURL}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02]"
                  />
                </div>

                {/* Wall mockup placeholder */}
                {photo.wallMockup && (
                  <div className="relative overflow-hidden aspect-video mb-4 bg-[var(--color-line)]">
                    <Image
                      src={photo.wallMockup}
                      alt={`${photo.title[l]} — ${l === "no" ? "print på vegg" : "print on wall"}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                )}

                <h2 className="font-display text-xl font-light mb-2">{photo.title[l]}</h2>

                {photo.printSizes && (
                  <div className="mb-4">
                    <p className="text-xs text-[var(--color-muted)] mb-1">{t("availableSizes")}</p>
                    <div className="flex flex-wrap gap-2">
                      {photo.printSizes.map((size) => (
                        <span
                          key={size}
                          className="text-xs border border-[var(--color-line)] px-2 py-0.5"
                        >
                          {size} cm
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/contact?print=${photo.slug}`}
                  className="inline-block text-sm border-b border-[var(--color-fg)] pb-0.5 hover:opacity-60 transition-opacity"
                >
                  {t("requestPrint")} →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Process section */}
        <div className="border-t border-[var(--color-line)] pt-12 max-w-xl">
          <h2 className="font-display text-2xl font-light mb-4">{t("processHeading")}</h2>
          <p className="text-[var(--color-muted)] leading-relaxed text-sm">{t("processText")}</p>
          <p className="text-sm text-[var(--color-muted)] mt-4">{t("requestPrintHint")}</p>
        </div>
      </Container>
    </div>
  );
}
