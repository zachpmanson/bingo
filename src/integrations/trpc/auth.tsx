import { useEffect, useState } from 'react';
import { trpcClient } from '#/integrations/trpc/client';

// Client-side identity lookup. Asks the server who the edge authenticated for
// the current request (string | null) — drives the sign-in badge and any
// owner-gating UI. Computed on demand so callers can refresh after login.
export function whoami() {
  return trpcClient.auth.whoami.query();
}

// Reactive hook: resolves the current identity once and returns it. Cards the
// owner-gating UI (edit vs fork) without a global data store.
export function useCurrentUser(): string | null {
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    whoami()
      .then(({ user: owned }) => {
        if (mounted) setUser(owned);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, []);
  return user;
}

// Floating sign-in bubble. Fixed to the bottom-right corner; on mount it asks
// the server who's signed in, then renders a compact round bubble showing either
// "signed in as zach" or a "sign in" control. The link/Pointer is a PLAIN <a>
// to /login — full page navigation so the browser's Basic-auth dialog appears;
// a client-side <Link> fetches the route and a fetch-based 401 never shows the
// credential prompt (the lesson spells learned).
export function UserBadge() {
  const [user, setUser] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    whoami()
      .then(({ user: u }) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;

  return user ? (
    <span className="fixed bottom-4 right-4 z-50 flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border border-[var(--line)] bg-[var(--header-bg)] px-3 text-xs font-medium text-[var(--sea-ink)] shadow-lg backdrop-blur">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
      <span className="hidden sm:inline">signed in as {user}</span>
      <span className="sm:hidden">{user}</span>
    </span>
  ) : (
    <a
      href="/login"
      title="Sign in"
      className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--header-bg)] text-xl text-[var(--sea-ink)] shadow-lg backdrop-blur transition hover:bg-[var(--link-bg-hover)]"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <polyline points="10 17 15 12 10 7" />
        <line x1="15" y1="12" x2="3" y2="12" />
      </svg>
    </a>
  );
}