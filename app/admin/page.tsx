import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/admin/auth";
import { getPhotos } from "@/content/images";
import { getTrips } from "@/content/trips";
import { LogoutButton } from "./LogoutButton";

export default async function AdminDashboard() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const photoCount = (await getPhotos()).length;
  const tripCount = getTrips().length;

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <header className="flex items-end justify-between border-b border-[var(--color-line)] pb-6 mb-12">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] mb-2">
            Admin
          </p>
          <h1 className="font-display text-3xl font-bold tracking-[0.05em] uppercase">
            Innhold
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[var(--color-muted)]">{admin.email}</span>
          <LogoutButton />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/photos"
          className="group block border border-[var(--color-line)] p-8 hover:border-[var(--color-fg)] transition-colors"
        >
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] mb-3">
            Bilder
          </p>
          <p className="font-display text-2xl font-bold tracking-[0.02em] uppercase mb-3">
            {photoCount} bilder
          </p>
          <p className="text-sm text-[var(--color-muted)] group-hover:text-[var(--color-fg)] transition-colors">
            Last opp, rediger metadata, slett →
          </p>
        </Link>

        <div className="block border border-[var(--color-line)] p-8 opacity-60">
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--color-muted)] mb-3">
            Turer
          </p>
          <p className="font-display text-2xl font-bold tracking-[0.02em] uppercase mb-3">
            {tripCount} turer
          </p>
          <p className="text-sm text-[var(--color-muted)]">Kommer i Fase 2</p>
        </div>
      </div>
    </main>
  );
}
