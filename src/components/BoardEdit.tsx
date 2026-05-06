import { useBoardsStream } from '#/hooks/useBoard.ts'
import { useEffect, useRef, useState } from 'react'
import type { Board } from '../db-collections'
import Button from './Button'

export default function BoardEdit() {
  const { createBoard } = useBoardsStream()
  const [board, setBoard] = useState<Board>({
    id: '',
    name: '',
    cells: Array(25).fill({ text: '', checked: false }),
    size: 5,
  })

  return (
    <div className="flex flex-col gap-4 p-4">
      <input
        className="border border-black border-solid p-2 text-2xl"
        style={{
          fontFamily: 'Impact, serif',
        }}
        type="text"
        value={board.name}
        onChange={(e) => setBoard({ ...board, name: e.target.value })}
      />
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
          onClick={() => createBoard(board.size, board.name, board.cells)}
        >
          Create Board
        </Button>
      </div>

      <div
        className="grid gap-0.5 bg-black p-0.5"
        style={{
          // gridTemplateRows: 'auto auto 1fr 1fr 1fr auto auto',
          gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))`,
        }}
      >
        {board?.cells.map((cell, index) => (
          <CellEditorDiv
            key={index}
            value={cell.text}
            index={index}
            onChange={(text) => {
              setBoard((prev) => {
                let newCells = [...prev.cells]
                newCells[index] = { ...newCells[index], text }
                return { ...prev, cells: newCells }
              })
            }}
          />
        ))}
      </div>

      <pre className="bg-white text-black w-full text-sm">
        {JSON.stringify(board, null, 2)}
      </pre>
    </div>
  )
}

// CellEditor component for contentEditable with ref
function CellEditorDiv({
  value,
  onChange,

  index,
}: {
  index: number
  value: string
  onChange: (text: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])
  return (
    <div
      className="text-black min-h-32 w-full h-full p-2 text-center flex flex-col items-center justify-center"
      contentEditable
      style={{
        backgroundColor: index % 2 === 0 ? '#fe9798' : '#fcd2d3',
      }}
      ref={ref}
      onInput={(e) => {
        onChange(e.currentTarget.textContent ?? '')
      }}
      suppressContentEditableWarning
    />
  )
}

function CellEditorTextarea({
  value,
  onChange,
}: {
  value: string
  onChange: (text: string) => void
}) {
  return (
    <textarea
      style={{
        resize: 'none',
      }}
      className="border text-black min-h-32 w-full h-full p-2 text-center"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
