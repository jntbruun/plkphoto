import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Container from "@/components/layout/Container";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("heading") };
}

// TODO: Replace all placeholder content when Petter delivers final copy + portrait
const aboutContent = {
  no: {
    heading: "Om Petter",
    intro:
      "Petter L. Krogstad er naturfotograf basert i Norge. Han har fotografert natur og dyreliv i over ti år — fra norsk skog og fjell til afrikas savanner.",
    body: [
      "Fotograferingen startet som en hobby, men ble raskt noe mer. En måte å slow down på i en verden som sjelden stopper. Å vente på det riktige øyeblikket tvinger deg til å være til stede på en måte som er vanskelig å finne andre steder.",
      "Petter er særlig opptatt av fugler og pattedyr i sin naturlige kontekst. Han foretrekker lange opptaksdager med minimalt utstyr fremfor kompliserte oppsett.",
      "Bildene er tilgjengelige som fine art prints. Ta kontakt for forespørsler.",
    ],
    equipment: "Utstyr",
    equipmentList: [
      "Canon EOS R5",
      "RF 100-500mm f/4.5-7.1L IS USM",
      "RF 600mm f/4L IS USM",
    ],
  },
  en: {
    heading: "About Petter",
    intro:
      "Petter L. Krogstad is a nature photographer based in Norway. He has photographed wildlife for over ten years — from Norwegian forests and mountains to the savannas of Africa.",
    body: [
      "Photography started as a hobby, but quickly became something more. A way to slow down in a world that rarely stops. Waiting for the right moment forces you to be present in a way that's hard to find elsewhere.",
      "Petter is particularly drawn to birds and mammals in their natural context. He prefers long shooting days with minimal equipment over complex setups.",
      "Images are available as fine art prints. Get in touch for enquiries.",
    ],
    equipment: "Equipment",
    equipmentList: [
      "Canon EOS R5",
      "RF 100-500mm f/4.5-7.1L IS USM",
      "RF 600mm f/4L IS USM",
    ],
  },
};

export default async function AboutPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale as Locale;
  const content = aboutContent[l];

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_420px] gap-16 md:gap-20 items-start">
          <div>
            <h1 className="font-display text-5xl md:text-7xl font-light mb-8">{content.heading}</h1>
            <p className="text-xl md:text-2xl font-light leading-relaxed mb-10 max-w-[52ch]">
              {content.intro}
            </p>
            <div className="flex flex-col gap-5 text-[var(--color-muted)] leading-relaxed max-w-[52ch]">
              {content.body.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-[var(--color-line)]">
              <h2 className="font-display text-lg font-light mb-4">{content.equipment}</h2>
              <ul className="flex flex-col gap-1 text-sm text-[var(--color-muted)]">
                {content.equipmentList.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Portrait placeholder — TODO: replace src when Petter delivers portrait */}
          <div>
            <div className="relative aspect-[3/4] overflow-hidden bg-[var(--color-line)]">
              {/* Placeholder until portrait is delivered */}
              <div className="absolute inset-0 flex items-center justify-center text-[var(--color-muted)] text-sm">
                Portrait — coming soon
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
