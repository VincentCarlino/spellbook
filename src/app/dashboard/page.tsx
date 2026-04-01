"use client";

import Link from "next/link";
import { useTheme } from "~/components/ThemeProvider";

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-zinc-400 transition-colors duration-200 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      aria-label="Toggle theme"
    >
      {isDark ? (
        // Sun icon
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Moon icon
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}

const cards = [
  {
    label: "Decks",
    href: "/decks",
    description: "Build and manage your card decks",
    accent: "text-cat-blue",
    accentBg: "bg-cat-blue/10",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="14" height="18" rx="2" />
        <path d="M8 2h12a2 2 0 0 1 2 2v14" />
      </svg>
    ),
  },
  {
    label: "Solo Play",
    description: "Practice and test your strategies",
    accent: "text-cat-green",
    accentBg: "bg-cat-green/10",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
        <path d="m13 19 2-2" />
        <path d="m17 15 2-2" />
        <path d="m19 13 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-1.6-1.6a2.41 2.41 0 0 0-3.4 0L14 8" />
        <path d="m6 6 4 4" />
        <path d="m5 10.5 4 4" />
        <path d="m3 21 5.5-5.5" />
      </svg>
    ),
  },
  {
    label: "Multiplayer",
    description: "Duel against other players",
    accent: "text-cat-mauve",
    accentBg: "bg-cat-mauve/10",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Settings",
    description: "Customize your experience",
    accent: "text-cat-yellow",
    accentBg: "bg-cat-yellow/10",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Spellbook
          </h1>
          <ThemeToggle />
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8">
          Welcome back. What would you like to do?
        </p>

        {/* Card grid */}
        <div className="grid grid-cols-2 gap-3">
          {cards.map((card) => {
            const cardClass = "group rounded-xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-zinc-900/50 cursor-pointer block";
            const content = (
              <>
                <div className={`inline-flex items-center justify-center rounded-lg p-2 mb-3 ${card.accentBg} ${card.accent}`}>
                  {card.icon}
                </div>
                <div className="font-semibold text-zinc-900 dark:text-white text-sm mb-0.5">
                  {card.label}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                  {card.description}
                </div>
              </>
            );
            return "href" in card && card.href ? (
              <Link key={card.label} href={card.href as string} className={cardClass}>
                {content}
              </Link>
            ) : (
              <button key={card.label} className={cardClass}>
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
