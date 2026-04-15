"use client";

import Image from "next/image";
import { Link } from "@/lib/navigation";
import type { PhotoImage, Locale } from "@/types/content";
import { cn } from "@/lib/utils";

interface PhotoCardProps {
  photo: PhotoImage;
  locale: Locale;
  href: string;
  sizes?: string;
}

export default function PhotoCard({ photo, locale, href, sizes = "100vw" }: PhotoCardProps) {
  const year = photo.date.slice(0, 4);

  return (
    <Link href={href} className="group block relative overflow-hidden" aria-label={photo.title[locale]}>
      <Image
        src={photo.src}
        alt={photo.alt[locale]}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        placeholder="blur"
        blurDataURL={photo.blurDataURL}
        className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02]"
        style={{ display: "block" }}
      />

      {/* Hover overlay — title + year */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 p-4 text-white",
          "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
          "transition-all duration-300",
        )}
        aria-hidden="true"
      >
        <p className="text-sm font-body leading-tight">{photo.title[locale]}</p>
        <p className="text-xs opacity-70 mt-0.5">{year}</p>
      </div>
    </Link>
  );
}
