import type { MetadataRoute } from "next";
import { getPhotos } from "@/content/images";
import { getCollections } from "@/content/collections";
import { getBlogPosts } from "@/content/blog";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const locales = ["no", "en"] as const;

function url(path: string, locale: string) {
  const prefix = locale === "no" ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  const staticPaths = ["/", "/portfolio", "/shop", "/blog", "/about", "/contact"];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: url(path, locale),
        lastModified: new Date(),
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l === "no" ? "x-default" : l, url(path, l)]),
          ),
        },
      });
    }

    // Collection pages
    const collections = getCollections();
    for (const col of collections) {
      entries.push({
        url: url(`/portfolio/${col.id}`, locale),
        lastModified: new Date(),
      });

      // Individual image pages
      const photos = getPhotos({ collection: col.id });
      for (const photo of photos) {
        entries.push({
          url: url(`/portfolio/${col.id}/${photo.slug}`, locale),
          lastModified: new Date(photo.date),
        });
      }
    }

    // Blog posts
    const posts = getBlogPosts();
    for (const post of posts) {
      entries.push({
        url: url(`/blog/${post.slug}`, locale),
        lastModified: new Date(post.publishedAt),
      });
    }
  }

  return entries;
}
