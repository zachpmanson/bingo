import Button from '#/components/Button.tsx';
import { useAllBoards } from '#/hooks/useBoard.ts';
import { useOpenedBoardIds } from '#/hooks/useOpenedBoards.ts';
import { seo } from '#/lib/seo';
import { detailedSuffix, hasItems } from '#/lib/utils.ts';

import { createFileRoute } from '@tanstack/react-router';

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

  // Resolve the device's opened ids against synced boards, preserving
  // most-recently-opened order and dropping any that no longer exist.
  const byId = new Map((boards ?? []).map((board) => [board.id, board]));
  const recent = openedIds
    .map((id) => byId.get(id))
    .filter((board): board is NonNullable<typeof board> => board != null);

  return (
    <div>
      <div className="flex flex-col gap-3 p-2">
        <h1>Your Boards</h1>
        <Button to="/board/new" className="w-full">
          Create New Board
        </Button>
        {hasItems(boards) ? (
          recent.map((board) => (
            <Button
              to="/board/$uuid"
              params={{ uuid: board.id }}
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
