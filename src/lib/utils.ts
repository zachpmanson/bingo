import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasItems<T>(arr: T[] | undefined | null): boolean {
  return !!(arr && arr.length > 0)
}
