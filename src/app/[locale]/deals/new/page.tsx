import { notFound, redirect } from "next/navigation";
import { getDictionary } from "@/i18n";
import { isLocale } from "@/i18n/config";
import { getCurrentUser } from "@/lib/auth";
import { getCategories } from "@/lib/deals";
import { DealForm } from "@/components/DealForm";

export default async function NewDealPage({ params }: PageProps<"/[locale]/deals/new">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/deals/new`);
  const t = getDictionary(locale);
  const categories = (await getCategories()).map((c) => ({ id: c.id, name: locale === "ar" ? c.nameAr : c.nameEn }));
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t.post.title}</h1>
      <p className="text-gray-600">{t.post.intro}</p>
      <DealForm locale={locale} t={t.post} categories={categories} />
    </div>
  );
}
