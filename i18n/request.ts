import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { locales, type AppLocale } from "@/lib/i18n";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !(locales as readonly string[]).includes(locale)) {
    notFound();
  }

  return {
    locale: locale as AppLocale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
