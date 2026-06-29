import Button from '#/components/Button.tsx';
import { seo } from '#/lib/seo';
import { useAllBoards } from '#/hooks/useBoard.ts';

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/board/list')({
  component: BoardListPage,
  ssr: false,
  head: () => ({
    meta: seo({
      title: 'All Boards',
      description: 'Browse your bingo boards.',
    }),
  }),
});

function BoardListPage() {
  const boards = useAllBoards();

  return (
    <div>
      <h1>All Boards</h1>
      <div className="flex flex-col">
        {boards && boards.length > 0 ? (
          boards.map((board) => (
            <Button to="/board/$uuid" params={{ uuid: board.id }}>
              <strong>{board.name}</strong> (size: {board.size}) ({board.id})
            </Button>
          ))
        ) : (
          <li>No boards found.</li>
        )}
      </div>
    </div>
  );
}
