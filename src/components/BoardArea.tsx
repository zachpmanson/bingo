import { boardsCollection } from '#/db-collections'
import { useBoards } from '#/hooks/useBoard.ts'
import { BoardWrapper, Cell } from './Cell'

export default function BoardArea({ uuid }: { uuid: string }) {
  const board = useBoards(uuid)

  return (
    <div className="py-4 flex flex-col gap-4">
      <div className="flex w-full justify-center">
        <span
          className="border-solid p-2 text-2xl"
          style={{
            fontFamily: 'Impact, serif',
          }}
        >
          {board?.name ?? 'Loading...'}
        </span>
      </div>
      <BoardWrapper size={board?.size ?? 5}>
        {board?.cells.map((cell, index) => (
          <Cell
            key={index}
            index={index}
            value={cell.text}
            onChange={() => {}}
            canEdit={false}
            isChecked={cell.checked}
            onClick={() =>
              boardsCollection.update(uuid, (draft) => {
                draft.cells[index].checked = !cell.checked
              })
            }
          />
        ))}
      </BoardWrapper>
    </div>
  )
}
