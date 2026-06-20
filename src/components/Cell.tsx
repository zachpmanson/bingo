import { useEffect, useRef } from 'react'

// CellEditor component for contentEditable with ref
export function Cell({
  value,
  onChange,
  canEdit,
  isChecked,
  index,
  onClick,
}: {
  index: number
  value: string
  onChange?: (text: string) => void
  isChecked?: boolean
  canEdit: boolean
  onClick?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value])

  const backgroundColor = isChecked
    ? 'bg-cell-checked'
    : index % 2 === 0
      ? 'bg-cell-light'
      : 'bg-cell-dark'

  return (
    <div
      className={`relative text-black aspect-square w-full min-h-0 overflow-hidden p-2 flex flex-col items-center justify-center transition-all duration-200 ease-out ${isChecked ? 'scale-100 border-[#015ff8] border-[5px]' : 'scale-100'} ${backgroundColor} ${canEdit ? 'cursor-text' : 'cursor-pointer select-none'}`}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`absolute inset-2 pointer-events-none transition-opacity duration-200 scale-80 ${isChecked ? 'opacity-40' : 'opacity-0'}`}
      >
        <line
          x1="5"
          y1="5"
          x2="95"
          y2="95"
          stroke="#015ff8"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <line
          x1="95"
          y1="5"
          x2="5"
          y2="95"
          stroke="#015ff8"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>
      <div
        className="relative z-10 text-center w-full outline-none"
        contentEditable={canEdit}
        ref={ref}
        onInput={(e) => {
          onChange?.(e.currentTarget.textContent ?? '')
        }}
        suppressContentEditableWarning
      />
    </div>
  )
}

export function BoardWrapper({
  size,
  children,
}: {
  size: number
  children: React.ReactNode
}) {
  return (
    <div
      className="grid gap-0.5 bg-black p-0.5"
      style={{
        // gridTemplateRows: 'auto auto 1fr 1fr 1fr auto auto',
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}
