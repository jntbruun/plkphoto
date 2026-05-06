"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="text-xs tracking-[0.15em] uppercase border-b border-[var(--color-fg)] hover:opacity-60 transition-opacity"
    >
      Logg ut
    </button>
  );
}
