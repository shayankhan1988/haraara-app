import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { getDictionary } from "@/i18n";
import { LOCALES, dirFor, isLocale } from "@/i18n/config";
import { Header } from "@/components/Header";
import { RegisterSW } from "@/components/RegisterSW";
import { themeScript } from "@/components/ThemeToggle";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  return {
    title: { default: `${t.brand} · ${t.tagline}`, template: `%s · ${t.brand}` },
    description: t.tagline,
    manifest: "/manifest.webmanifest",
    alternates: { languages: { en: "/en", ar: "/ar" } },
    appleWebApp: { capable: true, title: t.brand },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0b7464" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
};

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <Header locale={locale} t={t} />
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-gray-500 dark:text-zinc-400">{t.deal.affiliateNote}</footer>
        <RegisterSW />
      </body>
    </html>
  );
}
