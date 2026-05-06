import { useBoards, useBoardsStream } from '#/hooks/useBoard.ts'

export default function BoardArea({ uuid }: { uuid: string }) {
  const { sendCheck } = useBoardsStream()
  const board = useBoards(uuid)

  return (
    <>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${board?.cells.length || 0}, minmax(0, 1fr))`,
        }}
      >
        {board?.cells.map((cell, index) => (
          <button
            key={index}
            className="border p-4"
            onClick={() => sendCheck(board.id, index, !cell.checked)}
          >
            {cell.checked ? 'X' : ''}
            {cell.text}
          </button>
        ))}
      </div>
    </>
  )
}
