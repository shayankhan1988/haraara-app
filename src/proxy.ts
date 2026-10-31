import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALES } from "@/i18n/config";

function preferredLocale(req: NextRequest) {
  const cookie = req.cookies.get("hr_locale")?.value;
  if (cookie && (LOCALES as readonly string[]).includes(cookie)) return cookie;
  const accept = req.headers.get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("ar") ? "ar" : DEFAULT_LOCALE;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = LOCALES.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Sla de affiliate-redirect, API, Next-bestanden en statische bestanden over.
  matcher: ["/((?!go/|api/|_next/|manifest.webmanifest|sw.js|icons/|demo/|favicon.ico|robots.txt|offline.html).*)"],
};
