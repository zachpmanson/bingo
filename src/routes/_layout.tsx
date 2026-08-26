import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import { UserBadge } from '#/integrations/trpc/auth';

export const Route = createFileRoute('/_layout')({
  component: Layout,
});

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        <header className="relative z-10 flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2">
          <UserBadge />
        </header>
        <Outlet />
      </div>
      <footer className="flex items-center justify-center gap-4 p-4">
        <Link to="/" className="text-sm text-blue-400 underline">
          Home
        </Link>
        <DeployLink />
      </footer>
    </div>
  );
}

function DeployLink() {
  const rev = import.meta.env.VITE_BUILD_REV as string | undefined;
  const buildTime = import.meta.env.VITE_BUILD_TIME as string | undefined;

  if (!rev) return null;

  let label = rev.slice(0, 7);
  if (buildTime) {
    const date = new Date(parseInt(buildTime) * 1000);
    label = `${date.toISOString().slice(0, 10)} @ ${rev.slice(0, 7)}`;
  }

  return (
    <a
      href={`https://github.com/zachpmanson/bingo/commit/${rev}`}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-[var(--sea-ink-soft)] no-underline transition hover:text-[var(--sea-ink)]"
    >
      {label}
    </a>
  );
}