import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import Container from "./Container";

export default function Footer() {
  const t = useTranslations("footer");
  const commonT = useTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-line)] mt-24 md:mt-40">
      <Container className="py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="font-display text-2xl font-bold tracking-[0.18em] uppercase mb-2">PLKPHOTO</p>
            <p className="text-sm text-[var(--color-muted)]">{t("tagline")}</p>
          </div>

          <nav className="flex flex-col md:flex-row gap-4 md:gap-8 font-display text-xs tracking-[0.15em] uppercase" aria-label="Footer navigation">
            <Link href="/portfolio" className="hover:opacity-70 transition-opacity">Portfolio</Link>
            <Link href="/shop" className="hover:opacity-70 transition-opacity">Shop</Link>
            <Link href="/blog" className="hover:opacity-70 transition-opacity">Blog</Link>
            <Link href="/about" className="hover:opacity-70 transition-opacity">About</Link>
            <Link href="/contact" className="hover:opacity-70 transition-opacity">Contact</Link>
          </nav>
        </div>

        <div className="mt-8 pt-8 border-t border-[var(--color-line)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-muted)]">
            &copy; {year} {commonT("petterFullName")}. {t("allRights")}
          </p>

          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/plkphoto"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
              aria-label={t("followOnInstagram")}
            >
              Instagram
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
