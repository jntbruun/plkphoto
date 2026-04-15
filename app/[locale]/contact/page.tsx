import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import ContactForm from "@/components/ui/ContactForm";
interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ print?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("heading") };
}

export default async function ContactPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { print: printRef } = await searchParams;
  const t = await getTranslations({ locale, namespace: "contact" });

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <div className="max-w-lg">
          <h1 className="font-display text-5xl md:text-7xl font-light mb-6">{t("heading")}</h1>
          <p className="text-[var(--color-muted)] mb-12 leading-relaxed">{t("intro")}</p>

          <ContactForm initialReference={printRef} />

          <div className="mt-12 pt-8 border-t border-[var(--color-line)] text-sm text-[var(--color-muted)]">
            <p>
              {/* TODO: Replace with Petter's actual email */}
              <a
                href="mailto:petter@plkphoto.no"
                className="text-[var(--color-fg)] hover:opacity-60 transition-opacity"
              >
                petter@plkphoto.no
              </a>
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
}
