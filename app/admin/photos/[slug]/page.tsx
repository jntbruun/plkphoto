import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/admin/auth";
import { getPhoto } from "@/content/images";
import { EditForm } from "./EditForm";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditPhotoPage({ params }: PageProps) {
  const session = await getSession();
  if (!session.email) redirect("/admin/login");

  const { slug } = await params;
  const photo = getPhoto(slug);
  if (!photo) notFound();

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="border-b border-[var(--color-line)] pb-6 mb-8">
        <Link
          href="/admin/photos"
          className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] hover:text-[var(--color-fg)]"
        >
          ← Bilder
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-[0.05em] uppercase mt-2">
          {photo.title.no} <span className="text-[var(--color-muted)]">/ {photo.slug}</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="relative aspect-[3/2] bg-[var(--color-line)]">
          <Image
            src={photo.src}
            alt={photo.alt.en}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            placeholder="blur"
            blurDataURL={photo.blurDataURL}
            className="object-cover"
          />
        </div>
        <EditForm
          photo={{
            slug: photo.slug,
            collection: photo.collection,
            title: photo.title,
            latinName: photo.latinName ?? "",
            location: photo.location,
            date: photo.date,
            featuredOnHome: photo.featuredOnHome,
            availableAsPrint: photo.availableAsPrint,
          }}
        />
      </div>
    </main>
  );
}
