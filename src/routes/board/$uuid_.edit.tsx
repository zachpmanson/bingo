import { createFileRoute } from '@tanstack/react-router';

import BoardOwnerView from '#/components/BoardOwnerView.tsx';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/board/$uuid_/edit')({
  component: App,
  ssr: false,
  head: () => ({
    meta: seo({
      title: 'Manage Board',
      description: 'Manage and share your bingo board.',
    }),
  }),
});

function App() {
  const { uuid } = Route.useParams();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <BoardOwnerView uuid={uuid} />
    </div>
  );
}
