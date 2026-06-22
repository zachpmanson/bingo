import { boardsCollection } from '#/db-collections'
import { useBoards } from '#/hooks/useBoard.ts'
import { useClipboard } from '#/hooks/useClipboard.ts'
import { getCompletedLines, lineToSource } from '#/lib/bingo.ts'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import Button from './Button'
import { BoardWrapper, Cell } from './Cell'
import Confetti, { type Burst } from './Confetti'

export default function BoardArea({ uuid }: { uuid: string }) {
  const board = useBoards(uuid)
  const { share, copiedKey } = useClipboard()
  const navigate = useNavigate()

  // A shuffled board is an item-pool template, not a playable grid — send the
  // owner to its management view instead.
  useEffect(() => {
    if (board?.kind === 'shuffled') {
      navigate({ to: '/board/$uuid/edit', params: { uuid }, replace: true })
    }
  }, [board?.kind, navigate, uuid])

  // Celebrate whenever the user checks a cell that completes a new line —
  // confetti pops from the on-screen position of that line. We fire on the
  // explicit check action (not reactively on board state) so the optimistic
  // update / sync round-trip can't replay a stale "complete" state and trigger
  // a false burst. Deselecting a cell never celebrates.
  const boardRef = useRef<HTMLDivElement>(null)
  const [burst, setBurst] = useState<Burst | null>(null)

  const toggleCell = (index: number, wasChecked: boolean) => {
    boardsCollection.update(uuid, (draft) => {
      draft.cells[index].checked = !wasChecked
    })
    if (wasChecked || !board || !boardRef.current) return

    const before = new Set(
      getCompletedLines(board.cells, board.size).map((l) => l.key),
    )
    const nextCells = board.cells.map((c, i) =>
      i === index ? { ...c, checked: true } : c,
    )
    const newLine = getCompletedLines(nextCells, board.size).find(
      (l) => !before.has(l.key),
    )
    if (newLine) {
      const source = lineToSource(
        newLine,
        board.size,
        boardRef.current.getBoundingClientRect(),
      )
      setBurst((prev) => ({ key: (prev?.key ?? 0) + 1, source }))
    }
  }

  useEffect(() => {
    if (board?.name) document.title = board.name
  }, [board?.name])

  const shareLink = (key: string, path: string, title: string) =>
    void share(key, `${window.location.origin}${path}`, { title })

  return (
    <div className="py-4 flex flex-col gap-4 items-center">
      <Confetti burst={burst} />
      <div className="flex w-full flex-col items-center">
        <span
          className="border-solid p-2 text-2xl"
          style={{
            fontFamily: "'Impact','Anton', Impact, sans-serif",
          }}
        >
          {board?.name ?? 'Loading...'}
        </span>
        {board?.childIndex !== undefined && (
          <span className="text-sm text-gray-600">#{board.childIndex}</span>
        )}
      </div>
      <BoardWrapper ref={boardRef} size={board?.size ?? 5}>
        {board?.cells.map((cell, index) => (
          <Cell
            key={index}
            index={index}
            value={cell.text}
            onChange={() => {}}
            canEdit={false}
            isChecked={cell.checked}
            onClick={() => toggleCell(index, cell.checked)}
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
            {copiedKey === 'live' ? 'Copied!' : 'Share a Live Link'}
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
            {copiedKey === 'copy' ? 'Copied!' : 'Share a Copy'}
          </Button>
          <Button to={'/board/$uuid/fork'} params={{ uuid: board.id }}>
            Create a Fork
          </Button>
        </div>
      )}
    </div>
  )
}
