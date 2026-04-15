export const locales = ["no", "en"] as const;
export const defaultLocale = "no" as const;

export type AppLocale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is AppLocale {
  return (locales as readonly string[]).includes(locale);
}
