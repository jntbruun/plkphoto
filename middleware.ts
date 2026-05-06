import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/lib/i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|favicon.ico|images|brand|.*\\..*).*)",
  ],
};
