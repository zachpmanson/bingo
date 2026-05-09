import { createFileRoute } from '@tanstack/react-router'

import BoardArea from '#/components/BoardArea.tsx'

export const Route = createFileRoute('/board/$uuid')({
  component: App,
  ssr: false,
})

function App() {
  const { uuid } = Route.useParams()
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <BoardArea uuid={uuid} />
    </div>
  )
}
