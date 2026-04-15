import { Link } from "@/lib/navigation";
import Container from "@/components/layout/Container";

export default function NotFound() {
  return (
    <div className="pt-32 md:pt-40 pb-24 md:pb-40">
      <Container>
        <p className="font-display text-8xl md:text-[12rem] font-light text-[var(--color-line)] leading-none mb-8">
          404
        </p>
        <h1 className="font-display text-2xl font-light mb-4">
          Siden finnes ikke
        </h1>
        <p className="text-[var(--color-muted)] mb-8">
          Siden du leter etter eksisterer ikke eller har blitt flyttet.
        </p>
        <Link href="/" className="text-sm border-b border-[var(--color-fg)] pb-0.5 hover:opacity-60 transition-opacity">
          Tilbake til start →
        </Link>
      </Container>
    </div>
  );
}
