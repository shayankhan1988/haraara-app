"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";

export function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? `/${locale}`;
  const other: Locale = locale === "ar" ? "en" : "ar";
  const href = pathname.replace(new RegExp(`^/${locale}(?=/|$)`), `/${other}`);
  return (
    <Link
      href={href}
      hrefLang={other}
      onClick={() => {
        document.cookie = `hr_locale=${other}; path=/; max-age=31536000; samesite=lax`;
      }}
      className="text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
    >
      {label}
    </Link>
  );
}
