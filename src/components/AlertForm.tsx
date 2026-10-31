"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAlert } from "@/app/actions/alerts";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";

export function AlertForm({ locale, t, categories }: { locale: Locale; t: Dictionary["alerts"]; categories: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createAlert, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="card grid gap-4 p-5 sm:grid-cols-2">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label className="label" htmlFor="keyword">{t.keyword}</label>
        <input id="keyword" name="keyword" maxLength={80} className="input" placeholder={t.keywordHint} dir="auto" />
      </div>
      <div>
        <label className="label" htmlFor="categoryId">{t.category}</label>
        <select id="categoryId" name="categoryId" className="input" defaultValue="">
          <option value="">{t.any}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="maxPrice">{t.maxPrice}</label>
        <input id="maxPrice" name="maxPrice" inputMode="decimal" className="input" dir="ltr" />
      </div>
      <div>
        <label className="label" htmlFor="minTemperature">{t.minTemperature}</label>
        <input id="minTemperature" name="minTemperature" inputMode="numeric" className="input" dir="ltr" placeholder="0°" />
      </div>
      {state?.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <button disabled={pending} className="btn-primary sm:col-span-2 sm:justify-self-end">{t.add}</button>
    </form>
  );
}
