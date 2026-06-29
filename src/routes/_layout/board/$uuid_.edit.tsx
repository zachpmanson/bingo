import { createFileRoute } from '@tanstack/react-router';

import BoardOwnerView from '#/components/BoardOwnerView.tsx';
import { seo } from '#/lib/seo';

export const Route = createFileRoute('/_layout/board/$uuid_/edit')({
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
    <div className="flex flex-col">
      <BoardOwnerView uuid={uuid} />
    </div>
  );
}
