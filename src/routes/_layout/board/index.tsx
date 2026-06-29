import Button from '#/components/Button.tsx';
import { useAllBoards } from '#/hooks/useBoard.ts';
import { seo } from '#/lib/seo';
import { detailedSuffix, hasItems } from '#/lib/utils.ts';

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/board/')({
  component: AllBoardsPage,
  ssr: false,
  head: () => ({
    meta: seo({
      title: 'All Boards',
      description: 'Browse every bingo board.',
    }),
  }),
});

function AllBoardsPage() {
  const boards = useAllBoards();

  return (
    <div>
      <div className="flex flex-col gap-3 p-2">
        <h1>All Boards</h1>
        <Button to="/board/new" className="w-full">
          Create New Board
        </Button>
        {hasItems(boards) ? (
          boards.map((board) => (
            <Button
              to="/board/$uuid"
              params={{ uuid: board.id }}
              className="w-full"
            >
              <strong>{board.name}</strong> {detailedSuffix(board)} ({board.id})
            </Button>
          ))
        ) : (
          <li>No boards found.</li>
        )}
      </div>
    </div>
  );
}
