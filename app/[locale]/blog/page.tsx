import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/lib/navigation";
import Container from "@/components/layout/Container";
import { getBlogPosts } from "@/content/blog";
import type { Locale } from "@/types/content";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("heading") };
}

export default async function BlogPage({ params }: PageProps) {
  const { locale } = await params;
  const l = locale as Locale;
  const t = await getTranslations({ locale, namespace: "blog" });

  const posts = getBlogPosts();

  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <h1 className="font-display text-5xl md:text-7xl font-light mb-16 md:mb-24">
          {t("heading")}
        </h1>

        {posts.length === 0 ? (
          <p className="text-[var(--color-muted)]">
            {l === "no" ? "Ingen innlegg enda." : "No posts yet."}
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-[var(--color-line)]">
            {posts.map((post) => {
              const date = new Date(post.publishedAt).toLocaleDateString(
                l === "no" ? "nb-NO" : "en-GB",
                { year: "numeric", month: "long", day: "numeric" },
              );
              return (
                <article key={post.slug} className="py-10 md:py-12 first:pt-0">
                  <Link href={`/blog/${post.slug}`} className="group grid md:grid-cols-[1fr_280px] gap-8 items-start">
                    <div>
                      <time
                        dateTime={post.publishedAt}
                        className="text-xs text-[var(--color-muted)] mb-3 block"
                      >
                        {t("publishedAt")} {date}
                      </time>
                      <h2 className="font-display text-2xl md:text-3xl font-light mb-3 group-hover:opacity-70 transition-opacity">
                        {post.title[l]}
                      </h2>
                      <p className="text-[var(--color-muted)] leading-relaxed text-sm mb-4">
                        {post.excerpt[l]}
                      </p>
                      <span className="text-sm border-b border-[var(--color-fg)] pb-0.5">
                        {t("readMore")} →
                      </span>
                    </div>
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title[l]}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
