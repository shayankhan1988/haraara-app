import Link from "next/link";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import type { Dictionary } from "@/i18n/en";
import type { Locale } from "@/i18n/config";
import { LanguageSwitch } from "./LanguageSwitch";
import { ThemeToggle } from "./ThemeToggle";

export async function Header({ locale, t }: { locale: Locale; t: Dictionary }) {
  const user = await getCurrentUser();
  const unread = user ? await db.notification.count({ where: { userId: user.id, read: false } }) : 0;
  const base = `/${locale}`;
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 dark:border-white/10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href={base} className="flex items-center gap-2 text-lg font-extrabold text-brand-700 dark:text-brand-100">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-hot text-white">°</span>
          {t.brand}
        </Link>
        <form action={base} className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
          <input name="q" type="search" placeholder={t.feed.searchPlaceholder} aria-label={t.feed.search} className="input" />
        </form>
        <nav className="ms-auto flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <Link href={`${base}/deals/new`} className="btn-primary">+ {t.nav.post}</Link>
          {user ? (
            <>
              <Link href={`${base}/alerts`} className="text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white">{t.nav.alerts}</Link>
              <Link href={`${base}/notifications`} className="relative text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white">
                {t.nav.notifications}
                {unread > 0 && (
                  <span className="ms-1 rounded-full bg-hot px-1.5 text-xs font-bold text-white">{unread}</span>
                )}
              </Link>
              {hasRole(user, "MODERATOR") && (
                <Link href={`${base}/mod`} className="text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white">{t.nav.moderation}</Link>
              )}
              <form action={logout}>
                <input type="hidden" name="locale" value={locale} />
                <button className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white" title={user.username}>{t.nav.logout}</button>
              </form>
            </>
          ) : (
            <>
              <Link href={`${base}/login`} className="text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white">{t.nav.login}</Link>
              <Link href={`${base}/register`} className="btn-ghost">{t.nav.register}</Link>
            </>
          )}
          <LanguageSwitch locale={locale} label={t.nav.language} />
          <ThemeToggle labels={t.theme} />
        </nav>
      </div>
    </header>
  );
}
