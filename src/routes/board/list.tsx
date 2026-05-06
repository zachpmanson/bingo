import { useAllBoards } from '#/hooks/useBoard.ts'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/board/list')({
  component: BoardListPage,
  ssr: false,
})

export default function BoardListPage() {
  const boards = useAllBoards()

  return (
    <div>
      <h1>All Boards</h1>
      <ul>
        {boards && boards.length > 0 ? (
          boards.map((board) => (
            <li key={board.id}>
              <strong>{board.name}</strong> (size: {board.size})
            </li>
          ))
        ) : (
          <li>No boards found.</li>
        )}
      </ul>
    </div>
  )
}
