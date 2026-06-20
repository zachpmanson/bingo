import { useEffect } from 'react'
import { boardsCollection } from '#/db-collections'
import { useBoards } from '#/hooks/useBoard.ts'
import { useClipboard } from '#/hooks/useClipboard.ts'
import Button from './Button'
import { BoardWrapper, Cell } from './Cell'

export default function BoardArea({ uuid }: { uuid: string }) {
  const board = useBoards(uuid)
  const { share, copiedKey } = useClipboard()

  useEffect(() => {
    if (board?.name) document.title = board.name
  }, [board?.name])

  const shareLink = (key: string, path: string, title: string) =>
    void share(key, `${window.location.origin}${path}`, { title })

  return (
    <div className="py-4 flex flex-col gap-4">
      <div className="flex w-full justify-center">
        <span
          className="border-solid p-2 text-2xl"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
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
      {board && (
        <div className="flex justify-center gap-2">
          <Button
            onClick={() =>
              void shareLink(
                'live',
                `/board/${board.id}`,
                `${board.name} (live)`,
              )
            }
          >
            {copiedKey === 'live' ? 'Copied!' : 'Share live link'}
          </Button>
          <Button
            onClick={() =>
              void shareLink(
                'copy',
                `/share/${board.sharingId}`,
                `${board.name} (copy)`,
              )
            }
          >
            {copiedKey === 'copy' ? 'Copied!' : 'Share a copy'}
          </Button>
          <Button to={'/board/$uuid/edit'} params={{ uuid: board.id }}>
            Edit
          </Button>
        </div>
      )}
    </div>
  )
}
