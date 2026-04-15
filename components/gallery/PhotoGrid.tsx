"use client";

import Image from "next/image";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import { useRouter } from "@/lib/navigation";
import type { PhotoImage, Locale } from "@/types/content";

interface PhotoGridProps {
  photos: PhotoImage[];
  locale: Locale;
  collectionId: string;
}

export default function PhotoGrid({ photos, locale, collectionId }: PhotoGridProps) {
  const router = useRouter();

  const albumPhotos = photos.map((photo) => ({
    src: photo.src,
    width: photo.width,
    height: photo.height,
    alt: photo.alt[locale],
    key: photo.slug,
    slug: photo.slug,
    title: photo.title[locale],
    year: photo.date.slice(0, 4),
    blurDataURL: photo.blurDataURL,
  }));

  return (
    <RowsPhotoAlbum
      photos={albumPhotos}
      targetRowHeight={400}
      rowConstraints={{ minPhotos: 1, maxPhotos: 3 }}
      spacing={6}
      onClick={({ photo }) => {
        const p = photo as (typeof albumPhotos)[number];
        router.push(`/portfolio/${collectionId}/${p.slug}`);
      }}
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
              {/* Hover overlay */}
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
  );
}
