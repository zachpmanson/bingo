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

// Floating sign-in pill. Fixed to the bottom-right corner; on mount it asks
// the server who's signed in, then renders a compact pill showing either
// "signed in as zach" + "sign out" or a "sign in" pill. Matches spells'
// UserBadge pattern, styled for bingo's light theme tokens. The link is a
// PLAIN <a> to /login — full page navigation so the browser's Basic-auth
// dialog appears; a client-side <Link> fetches the route and a fetch-based
// 401 never shows the credential prompt (the lesson spells learned).
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

  // Edge logout. Identity is HTTP Basic auth stamped by Caddy, so there is no
  // server session to destroy. Caddy accepts a reserved `guest` account (see
  // the api route's createContext) and the app treats it as anonymous — so
  // signing in as guest SILENTLY signs out (no 401/popup). Land on / (a public
  // page, anonymous-readable) so guest is served without tripping a gate. The
  // root document's baseURI-scrub script then rewrites the credential-bearing
  // URL to a clean / before any fetch runs.
  const edgeLogout = () => {
    const { protocol, host } = window.location;
    window.location.href = `${protocol}//guest:guest@${host}/`;
  };

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 flex flex-col items-end gap-1">
      {user ? (
        <div className="flex items-center gap-2 rounded-full bg-[var(--header-bg)] px-3 py-1 text-xs font-medium text-[var(--sea-ink)] ring-1 ring-[var(--line)]">
          <span>signed in as {user}</span>
          <button
            type="button"
            onClick={edgeLogout}
            className="pointer-events-auto text-[var(--sea-ink-soft)] underline transition hover:text-[var(--sea-ink)]"
          >
            sign out
          </button>
        </div>
      ) : (
        <a
          href="/login"
          className="pointer-events-auto rounded-full bg-[var(--header-bg)] px-3 py-1 text-xs font-medium text-[var(--sea-ink-soft)] ring-1 ring-[var(--line)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          title="Sign in to edit"
        >
          sign in
        </a>
      )}
    </div>
  );
}
