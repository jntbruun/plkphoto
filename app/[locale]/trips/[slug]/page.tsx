import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Container from "@/components/layout/Container";
import { Link } from "@/lib/navigation";
import { getTrip, getTrips } from "@/content/trips";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const posts = getTrips();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getTrip(slug);
  if (!post) return {};
  const l = locale as Locale;
  return {
    title: post.title[l],
    description: post.excerpt[l],
    openGraph: { images: [{ url: post.coverImage }] },
  };
}

export default async function TripPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: "trips" });

  const post = getTrip(slug);
  if (!post) notFound();

  let MDXContent: React.ComponentType | null = null;
  try {
    const mod = await import(`../../../../content/trips/${slug}.${locale}.mdx`);
    MDXContent = mod.default;
  } catch {
    try {
      const mod = await import(`../../../../content/trips/${slug}.no.mdx`);
      MDXContent = mod.default;
    } catch (e) {
      console.error("MDX import failed", e);
    }
  }

  const date = new Date(post.publishedAt).toLocaleDateString(
    l === "no" ? "nb-NO" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <nav className="mb-10">
          <Link
            href="/trips"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            ← {t("heading")}
          </Link>
        </nav>

        <article className="max-w-[68ch]">
          <time dateTime={post.publishedAt} className="text-xs text-[var(--color-muted)] block mb-4">
            {t("publishedAt")} {date} · {post.readingMinutes} {l === "no" ? "min lesing" : "min read"}
          </time>

          <h1 className="font-display text-4xl md:text-5xl font-light leading-tight mb-8">
            {post.title[l]}
          </h1>

          <div className="relative aspect-video overflow-hidden mb-10">
            <Image
              src={post.coverImage}
              alt={post.title[l]}
              fill
              sizes="(max-width: 768px) 100vw, 68ch"
              className="object-cover"
              priority
            />
          </div>

          {MDXContent ? (
            <div className="prose-content">
              <MDXContent />
            </div>
          ) : (
            <p className="text-[var(--color-muted)]">{post.excerpt[l]}</p>
          )}
        </article>
      </Container>
    </div>
  );
}
