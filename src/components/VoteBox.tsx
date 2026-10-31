"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { vote } from "@/app/actions/deals";
import type { Locale } from "@/i18n/config";
import { temperatureLevel } from "@/lib/temperature";

type Props = {
  dealId: string;
  temperature: number;
  myVote: number;
  locale: Locale;
  canVote: boolean;
  disabled?: boolean;
  labels: { hot: string; cold: string; loginToVote: string };
};

const colors = {
  cold: "text-cold",
  neutral: "text-gray-500 dark:text-zinc-400",
  warm: "text-amber-600",
  hot: "text-hot",
  burning: "text-hot",
} as const;

export function VoteBox({ dealId, temperature, myVote, locale, canVote, disabled, labels }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [state, setState] = useOptimistic({ temperature, myVote });

  function cast(value: 1 | -1) {
    if (!canVote) {
      router.push(`/${locale}/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    start(async () => {
      const removing = state.myVote === value;
      const delta = removing ? -value : value - state.myVote;
      setState({ temperature: state.temperature + delta, myVote: removing ? 0 : value });
      await vote(dealId, value, locale);
    });
  }

  const level = temperatureLevel(state.temperature);
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-1 py-0.5" aria-busy={pending}>
      <button
        type="button"
        onClick={() => cast(-1)}
        disabled={disabled}
        aria-pressed={state.myVote === -1}
        title={canVote ? labels.cold : labels.loginToVote}
        className={`grid h-7 w-7 place-items-center rounded-full text-lg leading-none transition hover:bg-blue-50 dark:hover:bg-blue-950/50 disabled:opacity-40 ${state.myVote === -1 ? "bg-cold text-white hover:bg-cold" : "text-cold"}`}
      >
        <span aria-hidden>−</span>
        <span className="sr-only">{labels.cold}</span>
      </button>
      <span className={`min-w-12 text-center text-sm font-bold tabular-nums ${colors[level]}`} dir="ltr">
        {state.temperature}°
      </span>
      <button
        type="button"
        onClick={() => cast(1)}
        disabled={disabled}
        aria-pressed={state.myVote === 1}
        title={canVote ? labels.hot : labels.loginToVote}
        className={`grid h-7 w-7 place-items-center rounded-full text-lg leading-none transition hover:bg-red-50 dark:hover:bg-red-950/50 disabled:opacity-40 ${state.myVote === 1 ? "bg-hot text-white hover:bg-hot" : "text-hot"}`}
      >
        <span aria-hidden>+</span>
        <span className="sr-only">{labels.hot}</span>
      </button>
    </div>
  );
}
