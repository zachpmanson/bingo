import type { Cell } from '#/db-collections'

export type CompletedLine = {
  key: string
  type: 'row' | 'col' | 'diag' | 'antiDiag'
  index: number
}

// Returns every fully-checked line (rows, columns, and the two diagonals) on a
// square board. Each line has a stable `key` so callers can diff against a
// previous result to find lines that were *just* completed.
export function getCompletedLines(cells: Cell[], size: number): CompletedLine[] {
  if (!size || cells.length < size * size) return []

  const checked = (r: number, c: number) => cells[r * size + c]?.checked
  const lines: CompletedLine[] = []

  for (let r = 0; r < size; r++) {
    let all = true
    for (let c = 0; c < size; c++) if (!checked(r, c)) all = false
    if (all) lines.push({ key: `row-${r}`, type: 'row', index: r })
  }

  for (let c = 0; c < size; c++) {
    let all = true
    for (let r = 0; r < size; r++) if (!checked(r, c)) all = false
    if (all) lines.push({ key: `col-${c}`, type: 'col', index: c })
  }

  let diag = true
  let antiDiag = true
  for (let i = 0; i < size; i++) {
    if (!checked(i, i)) diag = false
    if (!checked(i, size - 1 - i)) antiDiag = false
  }
  if (diag) lines.push({ key: 'diag', type: 'diag', index: 0 })
  if (antiDiag) lines.push({ key: 'antiDiag', type: 'antiDiag', index: 0 })

  return lines
}

type Rect = { left: number; top: number; width: number; height: number }
export type ConfettiSource = { x: number; y: number; w: number; h: number }

// Maps a completed line to a viewport-relative origin rectangle for confetti.
// Rows become a horizontal strip, columns a vertical strip, and diagonals span
// the whole board (an axis-aligned source can't follow a diagonal).
export function lineToSource(
  line: CompletedLine,
  size: number,
  rect: Rect,
): ConfettiSource {
  const cellW = rect.width / size
  const cellH = rect.height / size

  if (line.type === 'row') {
    return {
      x: rect.left,
      y: rect.top + (line.index + 0.5) * cellH,
      w: rect.width,
      h: 0,
    }
  }
  if (line.type === 'col') {
    return {
      x: rect.left + (line.index + 0.5) * cellW,
      y: rect.top,
      w: 0,
      h: rect.height,
    }
  }
  return { x: rect.left, y: rect.top, w: rect.width, h: rect.height }
}
