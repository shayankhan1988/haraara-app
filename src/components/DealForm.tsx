"use client";

import { useActionState } from "react";
import { createDeal } from "@/app/actions/deals";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";

type Cat = { id: string; name: string };

export function DealForm({ locale, t, categories }: { locale: Locale; t: Dictionary["post"]; categories: Cat[] }) {
  const [state, action, pending] = useActionState(createDeal, undefined);
  return (
    <form action={action} className="card flex flex-col gap-4 p-5">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="label" htmlFor="url">{t.url}</label>
        <input id="url" name="url" type="url" required className="input" placeholder="https://" dir="ltr" />
      </div>
      <div>
        <label className="label" htmlFor="title">{t.dealTitle}</label>
        <input id="title" name="title" required minLength={8} maxLength={140} className="input" dir="auto" />
        <p className="mt-1 text-xs text-gray-500">{t.dealTitleHint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="price">{t.price} ({t.currency})</label>
          <input id="price" name="price" inputMode="decimal" className="input" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="originalPrice">{t.originalPrice} ({t.currency})</label>
          <input id="originalPrice" name="originalPrice" inputMode="decimal" className="input" dir="ltr" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="couponCode">{t.coupon}</label>
          <input id="couponCode" name="couponCode" maxLength={60} className="input font-mono" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="categoryId">{t.category}</label>
          <select id="categoryId" name="categoryId" required className="input" defaultValue="">
            <option value="" disabled>—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">{t.description}</label>
        <textarea id="description" name="description" required minLength={10} rows={6} className="input" dir="auto" />
        <p className="mt-1 text-xs text-gray-500">{t.descriptionHint}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="imageUrl">{t.image}</label>
          <input id="imageUrl" name="imageUrl" type="url" className="input" placeholder="https://" dir="ltr" />
        </div>
        <div>
          <label className="label" htmlFor="expiresAt">{t.expires}</label>
          <input id="expiresAt" name="expiresAt" type="date" className="input" />
        </div>
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <button disabled={pending} className="btn-primary self-end px-6 py-3">{t.submit}</button>
    </form>
  );
}
