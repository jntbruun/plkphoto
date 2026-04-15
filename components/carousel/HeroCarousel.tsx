"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { PhotoImage, Locale } from "@/types/content";
import { cn } from "@/lib/utils";

// Register useGSAP with GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

interface HeroCarouselProps {
  photos: PhotoImage[];
  locale: Locale;
  cta: string;
  ctaHref: string;
}

const AUTO_ADVANCE_MS = 6000;

export default function HeroCarousel({ photos, locale, cta, ctaHref }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setCurrent(index);
    },
    [],
  );

  const advance = useCallback(() => {
    setCurrent((c) => (c + 1) % photos.length);
  }, [photos.length]);

  // Auto-advance
  useEffect(() => {
    if (paused || reducedMotion || photos.length <= 1) return;
    timerRef.current = setTimeout(advance, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, reducedMotion, advance, photos.length]);

  // Touch/swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;

    const onDown = (e: PointerEvent) => {
      startX = e.clientX;
    };
    const onUp = (e: PointerEvent) => {
      const delta = e.clientX - startX;
      if (Math.abs(delta) < 40) return;
      if (delta < 0) setCurrent((c) => (c + 1) % photos.length);
      else setCurrent((c) => (c - 1 + photos.length) % photos.length);
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [photos.length]);

  // Keyboard navigation for the carousel
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrent((c) => (c - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setCurrent((c) => (c + 1) % photos.length);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [photos.length]);

  const photo = photos[current];
  if (!photo) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-svh min-h-[500px] overflow-hidden bg-[var(--color-fg)]"
      role="region"
      aria-roledescription="carousel"
      aria-label={locale === "no" ? "Utvalgte bilder" : "Featured images"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      {/* Slides — cross-fade by stacking and using key-driven opacity */}
      {photos.map((p, i) => (
        <div
          key={p.slug}
          className={cn(
            "absolute inset-0 transition-opacity",
            reducedMotion ? "" : "duration-1000",
            i === current ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={i !== current}
        >
          <Image
            src={p.src}
            alt={p.alt[locale]}
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL={p.blurDataURL}
            className="object-cover"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/50 pointer-events-none" />

      {/* Caption — bottom-left */}
      <div className="absolute bottom-20 left-5 md:left-12 text-white">
        <p
          key={`title-${current}`}
          className={cn(
            "font-display text-sm md:text-base mb-1 opacity-90",
            !reducedMotion && "animate-fade-up",
          )}
        >
          {photo.title[locale]}
        </p>
        <p
          key={`loc-${current}`}
          className={cn(
            "text-xs md:text-sm opacity-60",
            !reducedMotion && "animate-fade-up",
          )}
        >
          {photo.location[locale]} · {photo.date.slice(0, 4)}
        </p>
      </div>

      {/* CTA */}
      <div className="absolute bottom-10 left-5 md:left-12">
        <a
          href={ctaHref}
          className="inline-block text-white border-b border-white/60 pb-0.5 text-sm hover:opacity-70 transition-opacity"
        >
          {cta} →
        </a>
      </div>

      {/* Dot pagination */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-10 right-5 md:right-12 flex items-center gap-2"
          role="tablist"
          aria-label={locale === "no" ? "Velg bilde" : "Select image"}
        >
          {photos.map((p, i) => (
            <button
              key={p.slug}
              role="tab"
              aria-selected={i === current}
              aria-label={p.title[locale]}
              onClick={() => goTo(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-white transition-all duration-300",
                i === current ? "opacity-100 w-4" : "opacity-40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
