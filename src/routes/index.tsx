import Button from '#/components/Button.tsx';
import { useAllBoards } from '#/hooks/useBoard.ts';
import { UserBadge, useCurrentUser } from '#/integrations/trpc/auth';
import { useOpenedBoardIds } from '#/hooks/useOpenedBoards.ts';
import { seo } from '#/lib/seo';
import { detailedSuffix } from '#/lib/utils.ts';

import { createFileRoute } from '@tanstack/react-router';
import type { Board } from '#/db-collections';

export const Route = createFileRoute('/')({
  component: HomePage,
  ssr: false,
  head: () => ({
    meta: seo({
      description: 'Make, share, and play custom bingo boards.',
    }),
  }),
});

export default function HomePage() {
  const boards = useAllBoards();
  const openedIds = useOpenedBoardIds();
  const user = useCurrentUser();

  // Signed in: show the boards the current user OWNS, in a deterministic order
  // derived from the synced server data — the same list on every device
  // (mirrors spells, which serves the owner-scoped library from the server).
  // Deliberately NOT the device's localStorage 'recently opened' list, which is
  // what made the home page vary by device. Anonymous visitors keep the
  // device-local recents (there's no owner to scope by).
  let list: Board[];
  let has: boolean;
  if (user) {
    list = boards
      .filter((b) => b.owner === user)
      // stable cross-device order: name, then id as a tiebreaker.
      .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    has = list.length > 0;
  } else {
    // Resolve the device's opened ids against synced boards, preserving
    // most-recently-opened order and dropping any that no longer exist.
    const byId = new Map(boards.map((board) => [board.id, board]));
    list = openedIds
      .map((id) => byId.get(id))
      .filter((board): board is NonNullable<typeof board> => board != null);
    has = list.length > 0;
  }

  return (
    <div>
      {/* Login/sign-out pill in the corner — the home route isn't under the
          _layout wrapper that renders the floating UserBadge for board pages.
          Mount it here too so the homepage always shows the auth pill. */}
      <UserBadge />
      <div className="flex flex-col gap-3 p-2">
        <h1>Your Boards</h1>
        <Button to="/board/new" className="w-full">
          Create New Board
        </Button>
        {has ? (
          list.map((board) => (
            <Button
              to="/board/$uuid"
              params={{ uuid: board.id }}
              key={board.id}
              className="w-full"
            >
              <strong>{board.name}</strong> {detailedSuffix(board)}
            </Button>
          ))
        ) : (
          <p className="p-2 text-(--sea-ink-soft)">
            No boards yet. Create one, or open a shared board to see it here.
          </p>
        )}
        {/* <Button to="/board" className="w-full">
          Browse all boards
        </Button> */}
      </div>
    </div>
  );
}
