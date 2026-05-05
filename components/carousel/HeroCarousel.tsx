"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { PhotoImage, Locale } from "@/types/content";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const WORDMARK = "PLKPHOTO".split("");

interface HeroCarouselProps {
  photos: PhotoImage[];
  locale: Locale;
  cta: string;
  ctaHref: string;
  showLogo?: boolean;
}

const AUTO_ADVANCE_MS = 4500;

export default function HeroCarousel({ photos, locale, cta, ctaHref, showLogo = true }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scrollHintVisible, setScrollHintVisible] = useState(true);
  const [edgeHover, setEdgeHover] = useState<"left" | "right" | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGSAP(
    () => {
      if (reducedMotion || !wordmarkRef.current) return;
      const letters = wordmarkRef.current.querySelectorAll<HTMLSpanElement>("[data-letter]");
      gsap.from(letters, {
        opacity: 0,
        y: 14,
        filter: "blur(8px)",
        duration: 0.7,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: wordmarkRef, dependencies: [reducedMotion] },
  );

  useGSAP(
    () => {
      if (reducedMotion || !scrollHintRef.current) return;
      const arrow = scrollHintRef.current.querySelector("[data-bounce]");
      if (!arrow) return;
      gsap.to(arrow, {
        y: 6,
        duration: 0.9,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: scrollHintRef, dependencies: [reducedMotion] },
  );

  useEffect(() => {
    const onScroll = () => setScrollHintVisible(window.scrollY < 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goTo = useCallback((index: number) => setCurrent(index), []);
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % photos.length),
    [photos.length],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + photos.length) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    if (paused || reducedMotion || photos.length <= 1) return;
    timerRef.current = setTimeout(next, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, reducedMotion, next, photos.length]);

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
      if (delta < 0) next();
      else prev();
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [next, prev]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const photo = photos[current];
  if (!photo) return null;

  const arrowLabelPrev = locale === "no" ? "Forrige bilde" : "Previous image";
  const arrowLabelNext = locale === "no" ? "Neste bilde" : "Next image";

  return (
    <div
      ref={containerRef}
      className="relative w-full h-svh min-h-[600px] overflow-hidden bg-black"
      role="region"
      aria-roledescription="carousel"
      aria-label={locale === "no" ? "Utvalgte bilder" : "Featured images"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setEdgeHover(null);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const w = rect.width;
        if (x < w * 0.3) setEdgeHover("left");
        else if (x > w * 0.7) setEdgeHover("right");
        else setEdgeHover(null);
      }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
    >
      {photos.map((p, i) => (
        <div
          key={p.slug}
          className={cn(
            "absolute inset-0 transition-opacity",
            reducedMotion ? "" : "duration-700",
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

      {/* Soft bottom-only gradient so the caption stays readable */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

      {/* Centered white logo */}
      {showLogo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
          <h1
            ref={wordmarkRef}
            className={cn(
              "font-display italic font-black text-white/85 text-center select-none",
              "tracking-[0.16em] uppercase leading-[1.05]",
              "drop-shadow-[0_4px_30px_rgba(0,0,0,0.55)]",
            )}
            style={{ fontSize: "clamp(2rem, 6.5vw, 6rem)" }}
            aria-label="PLKPHOTO"
          >
            {WORDMARK.map((char, i) => (
              <span key={i} data-letter className="inline-block" aria-hidden="true">
                {char}
              </span>
            ))}
          </h1>
        </div>
      )}

      {/* Prev / Next arrows */}
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label={arrowLabelPrev}
            className={cn(
              "group absolute top-1/2 left-3 md:left-6 -translate-y-1/2 z-10 grid place-items-center w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/55 text-white transition-opacity duration-300",
              edgeHover === "left" ? "opacity-100" : "opacity-0",
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label={arrowLabelNext}
            className={cn(
              "group absolute top-1/2 right-3 md:right-6 -translate-y-1/2 z-10 grid place-items-center w-11 h-11 md:w-14 md:h-14 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/55 text-white transition-opacity duration-300",
              edgeHover === "right" ? "opacity-100" : "opacity-0",
            )}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </>
      )}

      {/* Caption — bottom-left */}
      <div className="absolute bottom-16 left-5 md:left-12 text-white max-w-[80%]">
        <p
          key={`title-${current}`}
          className={cn(
            "font-display tracking-[0.12em] uppercase text-sm md:text-base mb-1 opacity-90",
            !reducedMotion && "animate-fade-up",
          )}
        >
          {photo.title[locale]}
        </p>
        <p
          key={`loc-${current}`}
          className={cn(
            "text-xs md:text-sm opacity-70",
            !reducedMotion && "animate-fade-up",
          )}
        >
          {[photo.location[locale], photo.date.slice(0, 4)].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* CTA */}
      <div className="absolute bottom-6 left-5 md:left-12">
        <a
          href={ctaHref}
          className="font-display tracking-[0.15em] uppercase inline-block text-white border-b border-white/60 pb-0.5 text-xs hover:opacity-70 transition-opacity"
        >
          {cta} →
        </a>
      </div>

      {/* Scroll hint */}
      <div
        ref={scrollHintRef}
        className={cn(
          "absolute left-1/2 -translate-x-1/2 bottom-3 md:bottom-4 flex items-center justify-center text-white pointer-events-none transition-opacity duration-500",
          scrollHintVisible ? "opacity-60" : "opacity-0",
        )}
        aria-hidden="true"
      >
        <svg
          data-bounce
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>

      {/* Dot pagination */}
      {photos.length > 1 && (
        <div
          className="absolute bottom-6 right-5 md:right-12 flex items-center gap-2"
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
