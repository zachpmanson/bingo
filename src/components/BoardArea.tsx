import { boardsCollection } from '#/db-collections'
import { useBoards } from '#/hooks/useBoard.ts'
import { BoardWrapper, Cell } from './Cell'

export default function BoardArea({ uuid }: { uuid: string }) {
  const board = useBoards(uuid)

  return (
    <>
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
    </>
  )
}
