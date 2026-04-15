"use client";

import { useEffect } from "react";
import { Link, useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface ImageNavigationProps {
  prevSlug: string | null;
  nextSlug: string | null;
  prevTitle: string | null;
  nextTitle: string | null;
  collectionSlug: string;
  prevLabel: string;
  nextLabel: string;
}

export default function ImageNavigation({
  prevSlug,
  nextSlug,
  prevTitle,
  nextTitle,
  collectionSlug,
  prevLabel,
  nextLabel,
}: ImageNavigationProps) {
  const router = useRouter();

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && prevSlug) {
        router.push(`/portfolio/${collectionSlug}/${prevSlug}`);
      }
      if (e.key === "ArrowRight" && nextSlug) {
        router.push(`/portfolio/${collectionSlug}/${nextSlug}`);
      }
      if (e.key === "Escape") {
        router.push(`/portfolio/${collectionSlug}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevSlug, nextSlug, collectionSlug, router]);

  return (
    <nav
      className="flex items-center gap-6 text-sm shrink-0"
      aria-label="Image navigation"
    >
      <Link
        href={prevSlug ? `/portfolio/${collectionSlug}/${prevSlug}` : "#"}
        aria-label={prevSlug ? `${prevLabel}: ${prevTitle}` : undefined}
        aria-disabled={!prevSlug}
        className={cn(
          "flex items-center gap-2 transition-opacity",
          prevSlug ? "hover:opacity-60" : "opacity-20 pointer-events-none",
        )}
      >
        ← {prevLabel}
      </Link>

      <Link
        href={nextSlug ? `/portfolio/${collectionSlug}/${nextSlug}` : "#"}
        aria-label={nextSlug ? `${nextLabel}: ${nextTitle}` : undefined}
        aria-disabled={!nextSlug}
        className={cn(
          "flex items-center gap-2 transition-opacity",
          nextSlug ? "hover:opacity-60" : "opacity-20 pointer-events-none",
        )}
      >
        {nextLabel} →
      </Link>
    </nav>
  );
}
