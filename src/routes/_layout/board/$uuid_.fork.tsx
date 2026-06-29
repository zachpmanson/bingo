import { createFileRoute } from '@tanstack/react-router';

import BoardEdit from '#/components/BoardEdit.tsx';
import { useBoards } from '#/hooks/useBoard.ts';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_layout/board/$uuid_/fork')({
  component: App,
  ssr: false,
  head: () => ({
    meta: seo({
      title: 'Edit Board',
      description: 'Edit your custom bingo board.',
    }),
  }),
});

function App() {
  const { uuid } = Route.useParams();
  const board = useBoards(uuid);

  return (
    <div className="flex flex-col">
      {board ? (
        <BoardEdit initialBoard={board} />
      ) : (
        <div className="p-4">Loading...</div>
      )}
    </div>
  );
}
