import { createFileRoute } from '@tanstack/react-router';

import BoardEdit from '#/components/BoardEdit.tsx';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_layout/board/new')({
  head: () => ({
    meta: seo({
      title: 'New Board',
      description: 'Create a custom bingo board.',
    }),
  }),
  component: App,
  ssr: false,
});

function App() {
  return (
    <div className="flex flex-col">
      <BoardEdit />
    </div>
  );
}
