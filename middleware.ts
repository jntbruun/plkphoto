import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/lib/i18n";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const config = {
  matcher: [
    // Match all pathnames except:
    // - api routes
    // - _next static files
    // - _next image files
    // - public files (favicon, images, etc.)
    "/((?!api|_next/static|_next/image|favicon.ico|images|brand|.*\\..*).*)",
  ],
};
