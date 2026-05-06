"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError("Noe gikk galt. Prøv igjen.");
        return;
      }
      router.push("/admin/login?sent=1");
    } catch {
      setError("Nettverksfeil.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="block text-xs tracking-[0.15em] uppercase mb-2">
          E-post
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-fg)]"
          placeholder="petter@example.com"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="w-full font-display tracking-[0.15em] uppercase text-xs border border-[var(--color-fg)] py-3 hover:bg-[var(--color-fg)] hover:text-[var(--color-bg)] transition-colors disabled:opacity-50"
      >
        {submitting ? "Sender…" : "Send innloggingslenke"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
