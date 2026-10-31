import "server-only";
import en from "./en";
import ar from "./ar";
import type { Locale } from "./config";

const dictionaries = { en, ar };

export function getDictionary(locale: Locale) {
  return dictionaries[locale] ?? en;
}

export function timeAgo(date: Date, t: (typeof en)["time"], now = new Date()) {
  const mins = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutes.replace("{n}", String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t.hours.replace("{n}", String(hours));
  return t.days.replace("{n}", String(Math.floor(hours / 24)));
}
