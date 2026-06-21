import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import BoardArea from '#/components/BoardArea.tsx'
import { seo } from '#/lib/seo'
import { recordOpenedBoard } from '#/hooks/useOpenedBoards.ts'

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

  // Remember on this device that we've opened this board, so it shows on `/`.
  useEffect(() => {
    recordOpenedBoard(uuid)
  }, [uuid])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <BoardArea uuid={uuid} />
    </div>
  )
}
