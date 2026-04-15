"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/lib/navigation";
import { locales, type AppLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(next: AppLocale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div className={cn("flex items-center gap-1 text-sm font-body", className)}>
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-[var(--color-line)]">/</span>}
          <button
            onClick={() => switchLocale(l)}
            className={cn(
              "uppercase tracking-wide transition-opacity",
              l === locale
                ? "opacity-100 cursor-default"
                : "opacity-40 hover:opacity-80",
            )}
            aria-current={l === locale ? "true" : undefined}
          >
            {l}
          </button>
        </span>
      ))}
    </div>
  );
}
