"use client";

import { useState } from "react";
import Image from "next/image";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Link } from "@/lib/navigation";
import type { PhotoImage, Locale } from "@/types/content";

interface PhotoGridProps {
  photos: PhotoImage[];
  locale: Locale;
  collectionId: string;
}

export default function PhotoGrid({ photos, locale, collectionId }: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const albumPhotos = photos.map((photo) => ({
    src: photo.src,
    width: photo.width,
    height: photo.height,
    alt: photo.alt[locale],
    key: photo.slug,
    slug: photo.slug,
    title: photo.title[locale],
    latinName: photo.latinName,
    location: photo.location[locale],
    year: photo.date.slice(0, 4),
    blurDataURL: photo.blurDataURL,
  }));

  const lightboxSlides = albumPhotos.map((p) => ({
    src: p.src,
    alt: p.alt,
    width: p.width,
    height: p.height,
    slug: p.slug,
    title: p.title,
    latinName: p.latinName,
    location: p.location,
    year: p.year,
  }));

  const closeLabel = locale === "no" ? "Lukk" : "Close";
  const prevLabel = locale === "no" ? "Forrige" : "Previous";
  const nextLabel = locale === "no" ? "Neste" : "Next";
  const detailLabel = locale === "no" ? "Se hele siden" : "View full page";

  return (
    <>
      <RowsPhotoAlbum
        photos={albumPhotos}
        targetRowHeight={400}
        rowConstraints={{ minPhotos: 1, maxPhotos: 3 }}
        spacing={6}
        onClick={({ index }) => setLightboxIndex(index)}
        render={{
          image: (props, context) => {
            const photo = albumPhotos[context.index];
            if (!photo) return null;

            const { style, ...restProps } = props;

            return (
              <div
                className="group relative overflow-hidden cursor-pointer"
                style={{ width: style?.width, height: style?.height }}
              >
                <Image
                  {...restProps}
                  src={photo.src}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  placeholder="blur"
                  blurDataURL={photo.blurDataURL}
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.02]"
                  style={{ display: "block" }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-4 text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                  <p className="text-sm font-body leading-tight">{photo.title}</p>
                  <p className="text-xs opacity-70 mt-0.5">{photo.year}</p>
                </div>
              </div>
            );
          },
        }}
      />

      <Lightbox
        open={lightboxIndex >= 0}
        index={lightboxIndex >= 0 ? lightboxIndex : 0}
        close={() => setLightboxIndex(-1)}
        slides={lightboxSlides}
        labels={{ Close: closeLabel, Previous: prevLabel, Next: nextLabel }}
        styles={{
          container: {
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          },
        }}
        carousel={{ finite: false }}
        controller={{ closeOnBackdropClick: true }}
        render={{
          slideFooter: ({ slide }) => {
            const s = slide as (typeof lightboxSlides)[number];
            const meta = [s.location, s.year].filter(Boolean).join(" · ");
            return (
              <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8 md:pb-10 text-white pointer-events-auto">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <p className="font-display tracking-[0.15em] uppercase text-sm md:text-base">
                      {s.title}
                    </p>
                    {s.latinName && (
                      <p className="text-xs md:text-sm italic opacity-70 mt-1">
                        {s.latinName}
                      </p>
                    )}
                    {meta && (
                      <p className="text-xs opacity-60 mt-1">{meta}</p>
                    )}
                  </div>
                  <Link
                    href={`/portfolio/${collectionId}/${s.slug}`}
                    className="font-display tracking-[0.15em] uppercase text-xs border-b border-white/60 pb-0.5 hover:opacity-70 transition-opacity self-start md:self-auto"
                  >
                    {detailLabel} →
                  </Link>
                </div>
              </div>
            );
          },
        }}
      />
    </>
  );
}
