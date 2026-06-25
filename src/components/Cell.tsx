import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const MAX_FONT_PX = 40
const MIN_FONT_PX = 8

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
  const cellRef = useRef<HTMLDivElement>(null)

  // Shrink the font size until the text fits within the (square) cell.
  const fitText = useCallback(() => {
    const cell = cellRef.current
    const text = ref.current
    if (!cell || !text) return

    const styles = getComputedStyle(cell)
    const padX =
      parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight)
    const padY =
      parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom)
    const availW = cell.clientWidth - padX
    const availH = cell.clientHeight - padY
    if (availW <= 0 || availH <= 0) return

    let lo = MIN_FONT_PX
    let hi = MAX_FONT_PX
    let best = MIN_FONT_PX
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      text.style.fontSize = `${mid}px`
      if (text.scrollHeight <= availH && text.scrollWidth <= availW) {
        best = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    text.style.fontSize = `${best}px`
  }, [])

  useEffect(() => {
    if (ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
    fitText()
  }, [value, fitText])

  // Refit whenever the cell changes size (responsive / board resize).
  useLayoutEffect(() => {
    const cell = cellRef.current
    if (!cell) return
    const observer = new ResizeObserver(() => fitText())
    observer.observe(cell)
    return () => observer.disconnect()
  }, [fitText])

  const backgroundColor = isChecked
    ? 'bg-cell-checked'
    : index % 2 === 0
      ? 'bg-cell-light'
      : 'bg-cell-dark'

  return (
    <div
      ref={cellRef}
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
        className="relative z-10 text-center w-full outline-none break-normal"
        contentEditable={canEdit}
        data-placeholder={canEdit ? 'TBC' : undefined}
        ref={ref}
        onInput={(e) => {
          const text = e.currentTarget.textContent ?? ''
          if (!text) e.currentTarget.innerHTML = ''
          onChange?.(text)
          fitText()
        }}
        suppressContentEditableWarning
      />
    </div>
  )
}

export function BoardWrapper({
  size,
  children,
  ref,
}: {
  size: number
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <div
      ref={ref}
      className="grid gap-0.5 bg-black p-0.5 w-full max-w-[70ch]"
      style={{
        // gridTemplateRows: 'auto auto 1fr 1fr 1fr auto auto',
        gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}
