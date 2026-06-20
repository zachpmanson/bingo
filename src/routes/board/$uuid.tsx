import { createFileRoute } from '@tanstack/react-router'

import BoardArea from '#/components/BoardArea.tsx'
import { seo } from '#/lib/seo'

export const Route = createFileRoute('/board/$uuid')({
  component: App,
  ssr: false,
  head: () => ({
    meta: seo({
      title: 'Bingo Board',
      description: 'Play a custom bingo board.',
    }),
  }),
})

function App() {
  const { uuid } = Route.useParams()
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <BoardArea uuid={uuid} />
    </div>
  )
}
