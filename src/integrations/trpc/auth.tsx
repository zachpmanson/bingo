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

// Top-right identity chip. On mount it asks the server who's signed in, then
// shows "signed in as zach" or a "sign in" link. The link is a PLAIN <a> to
// /login — full page navigation so the browser's Basic-auth dialog appears; a
// client-side <Link> fetches the route and a fetch-based 401 never shows the
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
    <span className="rounded bg-[var(--sea-ink-soft)]/10 px-2 py-1 text-xs text-[var(--sea-ink)] ring-1 ring-[var(--line)]">
      signed in as {user}
    </span>
  ) : (
    <a
      href="/login"
      className="rounded bg-transparent px-2 py-1 text-xs no-underline ring-1 ring-[var(--line)] transition hover:bg-[var(--link-bg-hover)]"
    >
      sign in
    </a>
  );
}