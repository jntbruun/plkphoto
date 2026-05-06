"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { UploadZone } from "./UploadZone";

export interface PhotoListItem {
  slug: string;
  src: string;
  width: number;
  height: number;
  blurDataURL: string;
  title: { no: string; en: string };
  location: { no: string; en: string };
  date: string;
  collection: "wildlife" | "nature" | "other";
  featuredOnHome: boolean;
}

export function PhotosLibrary({ initialPhotos }: { initialPhotos: PhotoListItem[] }) {
  const [photos] = useState(initialPhotos);
  const [filter, setFilter] = useState<"all" | "wildlife" | "nature" | "other" | "featured">(
    "all",
  );
  const [search, setSearch] = useState("");

  const filtered = photos.filter((p) => {
    if (filter === "featured" && !p.featuredOnHome) return false;
    if (filter !== "all" && filter !== "featured" && p.collection !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.title.no.toLowerCase().includes(q) &&
        !p.title.en.toLowerCase().includes(q) &&
        !p.slug.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-10">
      <UploadZone />

      <div className="flex flex-wrap items-center gap-4 border-b border-[var(--color-line)] pb-4">
        {(["all", "wildlife", "nature", "other", "featured"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs tracking-[0.15em] uppercase pb-1 border-b ${
              filter === f
                ? "border-[var(--color-fg)] text-[var(--color-fg)]"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-fg)]"
            }`}
          >
            {f === "all" ? "Alle" : f === "featured" ? "Hero" : f}
          </button>
        ))}
        <input
          type="search"
          placeholder="Søk…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto border border-[var(--color-line)] bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--color-fg)] w-48"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/photos/${p.slug}`}
            className="group relative block aspect-square overflow-hidden bg-[var(--color-line)]"
          >
            <Image
              src={p.src}
              alt={p.title.en}
              fill
              sizes="(max-width: 768px) 50vw, 20vw"
              placeholder="blur"
              blurDataURL={p.blurDataURL}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs tracking-[0.1em] uppercase truncate">
                {p.title.no}
              </p>
              {p.featuredOnHome && (
                <p className="text-white/70 text-[10px] tracking-[0.15em] uppercase">
                  Hero
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-[var(--color-muted)] text-center py-12">
          Ingen bilder matcher.
        </p>
      )}
    </div>
  );
}
