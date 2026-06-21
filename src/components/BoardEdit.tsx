import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { boardsCollection, type Board } from '../db-collections'
import Button from './Button'
import { BoardWrapper, Cell } from './Cell'

export default function BoardEdit({ initialBoard }: { initialBoard?: Board }) {
  const navigate = useNavigate()
  const [board, setBoard] = useState<Board>(
    initialBoard
      ? {
          ...initialBoard,
          cells: initialBoard.cells.map((c) => ({
            text: c.text,
            checked: false,
          })),
        }
      : {
          id: '',
          sharingId: '',
          name: '',
          cells: Array(25).fill({ text: 'TO DO', checked: false }),
          size: 5,
        },
  )

  const trimmedName = board.name.trim()
  const hasName = trimmedName.length > 0

  return (
    <div className="flex flex-col gap-4 p-4 justify-center items-center">
      <input
        className="border border-black border-solid p-2 text-2xl"
        style={{
          fontFamily: "'Anton', Impact, sans-serif",
        }}
        type="text"
        placeholder="Title.."
        value={board.name}
        onChange={(e) => setBoard({ ...board, name: e.target.value })}
      />
      {!hasName && (
        <p className="text-sm text-red-600">Give your board a name to create it.</p>
      )}
      <div className="flex w-full justify-between ">
        <input
          type="number"
          className="border border-black border-solid w-14 p-2"
          value={board.size}
          onChange={(e) => {
            const size = Number(e.target.value)
            const newCells = Array.from({ length: size * size }, () => ({
              text: '',
              checked: false,
            }))
            setBoard({ ...board, size: size, cells: newCells })
          }}
        />
        <Button
          disabled={!hasName}
          onClick={() => {
            if (!hasName) return
            const newBoard: Board = {
              ...board,
              name: trimmedName,
              id: crypto.randomUUID(),
              sharingId: crypto.randomUUID(),
            }
            boardsCollection.insert(newBoard)
            navigate({
              to: '/board/$uuid',
              params: { uuid: newBoard.id },
            })
          }}
        >
          Create Board
        </Button>
      </div>

      <BoardWrapper size={board.size}>
        {board?.cells.map((cell, index) => (
          <Cell
            key={index}
            value={cell.text}
            index={index}
            canEdit
            onChange={(text) => {
              setBoard((prev) => {
                let newCells = [...prev.cells]
                newCells[index] = { ...newCells[index], text }
                return { ...prev, cells: newCells }
              })
            }}
          />
        ))}
      </BoardWrapper>

      {/* <pre className="bg-white text-black w-full text-sm">
        {JSON.stringify(board, null, 2)}
      </pre> */}
    </div>
  )
}
