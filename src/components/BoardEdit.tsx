import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { boardsCollection, type Board, type Cell } from '../db-collections'
import Button from './Button'
import { BoardWrapper, Cell as CellView } from './Cell'

const emptyCell = (): Cell => ({ text: '', checked: false })

export default function BoardEdit({ initialBoard }: { initialBoard?: Board }) {
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board>(
    initialBoard
      ? {
          ...initialBoard,
          kind: initialBoard.kind ?? 'fixed',
          cells: initialBoard.cells.map((c) => ({
            text: c.text,
            checked: false,
          })),
        }
      : {
          id: '',
          sharingId: '',
          name: '',
          kind: 'fixed',
          childCount: 0,
          cells: Array.from({ length: 25 }, () => ({
            text: 'TO DO',
            checked: false,
          })),
          size: 5,
        },
  )

  const trimmedName = board.name.trim()
  const hasName = trimmedName.length > 0
  const isShuffled = board.kind === 'shuffled'
  const needed = board.size * board.size
  const hasEnoughItems = board.cells.length >= needed
  const canCreate = hasName && (!isShuffled || hasEnoughItems)

  // Switching kind keeps the texts the user already typed: going to fixed
  // normalizes the pool to exactly size² cells; going to shuffled keeps them all.
  const setKind = (kind: Board['kind']) => {
    setBoard((prev) => {
      if (kind === prev.kind) return prev
      if (kind === 'fixed') {
        const cells = Array.from(
          { length: prev.size * prev.size },
          (_, i) => prev.cells[i] ?? emptyCell(),
        )
        return { ...prev, kind, cells }
      }
      return { ...prev, kind }
    })
  }

  const setSize = (size: number) => {
    setBoard((prev) =>
      // Fixed boards are a locked grid, so resizing rebuilds the cell array.
      // Shuffled boards keep their whole pool; size only sets the target n.
      prev.kind === 'fixed'
        ? {
            ...prev,
            size,
            cells: Array.from({ length: size * size }, emptyCell),
          }
        : { ...prev, size },
    )
  }

  const setCellText = (index: number, text: string) =>
    setBoard((prev) => {
      const cells = [...prev.cells]
      cells[index] = { ...cells[index], text }
      return { ...prev, cells }
    })

  const addItem = () =>
    setBoard((prev) => ({ ...prev, cells: [...prev.cells, emptyCell()] }))

  const removeItem = (index: number) =>
    setBoard((prev) => ({
      ...prev,
      cells: prev.cells.filter((_, i) => i !== index),
    }))

  const isEditing = Boolean(initialBoard?.id)

  const save = () => {
    if (!canCreate) return
    const cells = board.cells.map((c) => ({ text: c.text, checked: false }))

    if (isEditing) {
      // Edit in place: the owner is changing this board's own content, so keep
      // its id/sharingId (existing share links stay valid) and update the
      // record rather than forking a fresh copy.
      boardsCollection.update(initialBoard!.id, (draft) => {
        draft.name = trimmedName
        draft.kind = board.kind
        draft.size = board.size
        draft.cells = cells
      })
      navigate({ to: '/board/$uuid/edit', params: { uuid: initialBoard!.id } })
      return
    }

    // A newly created board is a fresh source: it has no parent and no children
    // yet.
    const { childIndex: _childIndex, ...rest } = board
    const newBoard: Board = {
      ...rest,
      name: trimmedName,
      id: crypto.randomUUID(),
      sharingId: crypto.randomUUID(),
      childCount: 0,
      cells,
    }
    boardsCollection.insert(newBoard)
    if (newBoard.kind === 'shuffled') {
      navigate({ to: '/board/$uuid/edit', params: { uuid: newBoard.id } })
    } else {
      navigate({ to: '/board/$uuid', params: { uuid: newBoard.id } })
    }
  }

  return (
    <div className="w-full justify-center flex">
      <div className="flex flex-col gap-4 p-4 justify-center items-center w-full max-w-[70ch]">
        <input
          className="border border-black border-solid p-2 text-2xl w-full"
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
          }}
          type="text"
          placeholder="Title.."
          value={board.name}
          onChange={(e) => setBoard({ ...board, name: e.target.value })}
        />
        {!hasName && (
          <p className="text-sm text-red-600">
            Give your board a name to create it.
          </p>
        )}

        <div className="flex w-full  flex-col gap-4">
          <div className="flex w-full justify-between items-center gap-2">
            <label className="flex items-center gap-2">
              <span className="text-sm">Size</span>
              <input
                type="number"
                className="border border-black border-solid w-14 p-2"
                value={board.size}
                onChange={(e) => setSize(Number(e.target.value))}
              />
            </label>
            <Button disabled={!canCreate} onClick={save}>
              {isEditing ? 'Save' : 'Create Board'}
            </Button>
          </div>
          <fieldset className="flex gap-4">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="kind"
                checked={board.kind === 'fixed'}
                onChange={() => setKind('fixed')}
              />
              Locked positions
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="kind"
                checked={board.kind === 'shuffled'}
                onChange={() => setKind('shuffled')}
              />
              Randomized
            </label>
          </fieldset>
        </div>

        {isShuffled ? (
          <div className="flex flex-col gap-2 w-full">
            <p className="text-sm text-gray-600">
              {hasEnoughItems
                ? `${board.size}×${board.size} → ${board.cells.length}+ items (each link draws a random ${needed}) `
                : `Add at least ${needed} items (${needed - board.cells.length} more needed).`}
            </p>
            {board.cells.map((cell, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  className="border border-black border-solid p-2 flex-1"
                  type="text"
                  placeholder={`Item ${index + 1}`}
                  value={cell.text}
                  onChange={(e) => setCellText(index, e.target.value)}
                />
                <Button onClick={() => removeItem(index)}>✕</Button>
              </div>
            ))}
            <Button onClick={addItem}>Add item</Button>
          </div>
        ) : (
          <BoardWrapper size={board.size}>
            {board.cells.map((cell, index) => (
              <CellView
                key={index}
                value={cell.text}
                index={index}
                canEdit
                onChange={(text) => setCellText(index, text)}
              />
            ))}
          </BoardWrapper>
        )}
      </div>
    </div>
  )
}
