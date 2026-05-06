import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: { providerImportSource: undefined },
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "muctqlzktclvroyuiftp.supabase.co",
        pathname: "/storage/v1/object/public/photos/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
  outputFileTracingRoot: process.cwd(),
  redirects: async () => [
    { source: "/blog", destination: "/trips", permanent: true, locale: false },
    { source: "/blog/:slug", destination: "/trips/:slug", permanent: true, locale: false },
    { source: "/en/blog", destination: "/en/trips", permanent: true, locale: false },
    { source: "/en/blog/:slug", destination: "/en/trips/:slug", permanent: true, locale: false },
  ],
};

export default withNextIntl(withMDX(nextConfig));
