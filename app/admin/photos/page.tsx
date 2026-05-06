import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/admin/auth";
import { getPhotos } from "@/content/images";
import { PhotosLibrary } from "./PhotosLibrary";

export default async function PhotosPage() {
  const session = await getSession();
  if (!session.email) redirect("/admin/login");

  const photos = getPhotos();

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <header className="flex items-end justify-between border-b border-[var(--color-line)] pb-6 mb-8">
        <div>
          <Link
            href="/admin"
            className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[var(--color-fg)]"
          >
            ← Admin
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-[0.05em] uppercase mt-2">
            Bilder
          </h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {photos.length} bilder · last opp nye eller rediger eksisterende
          </p>
        </div>
      </header>

      <PhotosLibrary
        initialPhotos={photos.map((p) => ({
          slug: p.slug,
          src: p.src,
          width: p.width,
          height: p.height,
          blurDataURL: p.blurDataURL,
          title: p.title,
          location: p.location,
          date: p.date,
          collection: p.collection,
          featuredOnHome: p.featuredOnHome,
        }))}
      />
    </main>
  );
}
