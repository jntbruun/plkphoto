"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import { cn } from "@/lib/utils";

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/portfolio", label: t("portfolio") },
    { href: "/shop", label: t("shop") },
    { href: "/blog", label: t("blog") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  const isHome = pathname === "/" || /^\/[a-z]{2}\/?$/.test(pathname);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[var(--color-bg)]/90 backdrop-blur-sm border-b border-[var(--color-line)]"
          : isHome
            ? "bg-gradient-to-b from-black/60 to-transparent"
            : "bg-transparent",
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Wordmark — small, top-left */}
          <Link
            href="/"
            className="font-display text-base md:text-lg font-bold tracking-[0.18em] uppercase text-white"
          >
            PLKPHOTO
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "font-display text-xs tracking-[0.15em] uppercase transition-opacity text-white",
                  pathname.startsWith(href)
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <LocaleSwitcher className="hidden md:flex" />

            <button
              className="md:hidden flex flex-col gap-[5px] p-2 -mr-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={menuOpen}
            >
              <span
                className={cn(
                  "block w-5 h-px bg-white transition-all duration-300",
                  menuOpen && "translate-y-[6px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "block w-5 h-px bg-white transition-all duration-300",
                  menuOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "block w-5 h-px bg-white transition-all duration-300",
                  menuOpen && "-translate-y-[6px] -rotate-45",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          menuOpen ? "max-h-96 border-t border-[var(--color-line)]" : "max-h-0",
        )}
        aria-hidden={!menuOpen}
      >
        <nav
          className="bg-[var(--color-bg)] px-5 py-6 flex flex-col gap-5"
          aria-label="Mobile navigation"
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "font-display text-base tracking-[0.15em] uppercase",
                pathname.startsWith(href) ? "opacity-100" : "opacity-60",
              )}
              tabIndex={menuOpen ? 0 : -1}
            >
              {label}
            </Link>
          ))}
          <LocaleSwitcher className="mt-2" />
        </nav>
      </div>
    </header>
  );
}
