import { createFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';

import BoardArea from '#/components/BoardArea.tsx';
import { recordOpenedBoard } from '#/hooks/useOpenedBoards.ts';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_layout/board/$uuid')({
  component: App,
  ssr: false,
  head: () => ({
    meta: seo({
      title: 'Bingo Board',
      description: 'Play a custom bingo board.',
    }),
  }),
});

function App() {
  const { uuid } = Route.useParams();

  // Remember on this device that we've opened this board, so it shows on `/`.
  useEffect(() => {
    recordOpenedBoard(uuid);
  }, [uuid]);

  return (
    <div className="flex flex-col">
      <BoardArea uuid={uuid} />
    </div>
  );
}
