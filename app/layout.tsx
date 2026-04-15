import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | PLKPHOTO",
    default: "PLKPHOTO — Petter L. Krogstad",
  },
  description: "Nature photography by Petter L. Krogstad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
