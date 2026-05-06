import { LoginForm } from "./LoginForm";

interface PageProps {
  searchParams: Promise<{ error?: string; sent?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { error, sent } = await searchParams;
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl tracking-[0.15em] uppercase mb-2">
          PLKPHOTO Admin
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Skriv inn e-postadressen din. Du får en innloggingslenke som er gyldig
          i 15 minutter.
        </p>

        {sent ? (
          <p className="text-sm rounded border border-[var(--color-line)] p-4 bg-[var(--color-line)]/30">
            Sjekk innboksen. Hvis e-posten har tilgang, kommer det en lenke nå.
          </p>
        ) : (
          <LoginForm />
        )}

        {error === "invalid" && (
          <p className="mt-6 text-sm text-red-600">
            Lenken er ugyldig eller utløpt. Prøv på nytt.
          </p>
        )}
        {error === "missing" && (
          <p className="mt-6 text-sm text-red-600">
            Manglet kode i URL.
          </p>
        )}
        {error === "forbidden" && (
          <p className="mt-6 text-sm text-red-600">
            E-postadressen har ikke admin-tilgang.
          </p>
        )}
      </div>
    </main>
  );
}
