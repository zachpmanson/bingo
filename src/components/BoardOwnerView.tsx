import { useBoards } from '#/hooks/useBoard.ts'
import { useClipboard } from '#/hooks/useClipboard.ts'
import { useEffect } from 'react'
import Button from './Button'

// Static (non-playable) view of a board for its owner: shows the items and a
// share link. Works for both board kinds — for a shuffled board the share link
// generates a fresh random board on every open; for a fixed board it generates
// a copy. This is where you land after creating a shuffled board.
export default function BoardOwnerView({ uuid }: { uuid: string }) {
  const board = useBoards(uuid)
  const { share, copiedKey } = useClipboard()

  useEffect(() => {
    if (board?.name) document.title = board.name
  }, [board?.name])

  if (!board) return <div className="p-4">Loading...</div>

  const isShuffled = board.kind === 'shuffled'
  const summary = isShuffled
    ? `${board.cells.length} items → ${board.size}×${board.size} (each link draws a random ${board.size * board.size})`
    : `${board.size}×${board.size}`

  return (
    <div className="py-4 px-4 flex flex-col gap-4 items-center">
      <span
        className="border-solid p-2 text-2xl"
        style={{ fontFamily: "'Impact','Anton', Impact, sans-serif" }}
      >
        {board.name}
      </span>
      <p className="text-sm text-gray-600">{summary}</p>
      <p className="text-sm text-gray-600">
        {board.childCount === 0
          ? 'No boards generated yet'
          : `${board.childCount} board${board.childCount === 1 ? '' : 's'} generated`}
      </p>
      <div className="flex justify-center gap-2">
        <Button
          onClick={() =>
            void share(
              'copy',
              `${window.location.origin}/share/${board.sharingId}`,
              { title: board.name },
            )
          }
        >
          {copiedKey === 'copy' ? 'Copied!' : 'Copy Random Link'}
        </Button>
        <Button to={'/board/$uuid/fork'} params={{ uuid: board.id }}>
          Edit
        </Button>
      </div>
      <ul className="flex flex-col gap-1 w-full max-w-[70ch]">
        {[...board.cells].reverse().map((cell, reversedIndex) => (
          <li
            key={board.cells.length - 1 - reversedIndex}
            className="border border-black border-solid p-2 bg-white"
          >
            {cell.text || <span className="text-gray-400">(empty)</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
