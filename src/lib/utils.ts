import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Board } from '../db-collections'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasItems<T>(arr: T[] | undefined | null): boolean {
  return !!(arr && arr.length > 0)
}

export function suffix(b: Board) {
  if (b.kind === 'fixed' && b.childIndex) {
    return `#${b.childIndex} (${b.size}x${b.size})`
  }
  if (b.kind === 'shuffled') {
    return `Template (${b.size}x${b.size})`
  }
  return `(${b.size}x${b.size})`
}
