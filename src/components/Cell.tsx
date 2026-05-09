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
  return (
    <div
      className="text-black min-h-32 w-full h-full p-2 text-center flex flex-col items-center justify-center"
      contentEditable={canEdit}
      style={{
        backgroundColor: isChecked
          ? '#a0e7e5'
          : index % 2 === 0
            ? '#fe9798'
            : '#fcd2d3',
      }}
      ref={ref}
      onInput={(e) => {
        onChange?.(e.currentTarget.textContent ?? '')
      }}
      onClick={onClick}
      suppressContentEditableWarning
    />
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
