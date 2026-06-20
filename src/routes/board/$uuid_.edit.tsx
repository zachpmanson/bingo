import { createFileRoute } from '@tanstack/react-router'

import BoardEdit from '#/components/BoardEdit.tsx'
import { useBoards } from '#/hooks/useBoard.ts'

export const Route = createFileRoute('/board/$uuid_/edit')({
  component: App,
  ssr: false,
  head: () => ({
    meta: [{ title: 'Edit Board' }],
  }),
})

function App() {
  const { uuid } = Route.useParams()
  const board = useBoards(uuid)

  return (
    <div className="flex flex-col h-screen bg-white">
      {board ? (
        <BoardEdit initialBoard={board} />
      ) : (
        <div className="p-4">Loading...</div>
      )}
    </div>
  )
}
