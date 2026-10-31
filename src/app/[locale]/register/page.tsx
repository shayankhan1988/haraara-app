import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export default async function Page({ params, searchParams }: PageProps<"/[locale]/register">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith(`/${locale}`) ? sp.next : `/${locale}`;
  if (await getCurrentUser()) redirect(next);
  const t = getDictionary(locale);
  return <AuthForm mode="register" locale={locale} t={t.auth} next={next} />;
}
