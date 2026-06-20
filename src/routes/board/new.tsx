import { createFileRoute } from '@tanstack/react-router'

import BoardEdit from '#/components/BoardEdit.tsx'

export const Route = createFileRoute('/board/new')({
  head: () => ({
    meta: [{ title: 'New Board' }],
  }),
  component: App,
  ssr: false,
})

function App() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <BoardEdit />
    </div>
  )
}
