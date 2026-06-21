import { useSyncExternalStore } from 'react'

const KEY = 'bingo:opened-boards'
// Fired on same-tab writes; the native `storage` event only fires in *other* tabs.
const EVENT = 'opened-boards-changed'
const EMPTY: string[] = []

function read(): string[] {
  if (typeof localStorage === 'undefined') return EMPTY
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string')
      : EMPTY
  } catch {
    return EMPTY
  }
}

function write(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event(EVENT))
}

/** Record that this device opened a board, moving it to the front of the list. */
export function recordOpenedBoard(id: string) {
  if (typeof localStorage === 'undefined') return
  write([id, ...read().filter((x) => x !== id)])
}

/** Forget a board this device had opened. */
export function removeOpenedBoard(id: string) {
  if (typeof localStorage === 'undefined') return
  write(read().filter((x) => x !== id))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

// useSyncExternalStore needs a referentially-stable snapshot, so only reparse
// when the raw stored string actually changes.
let cacheRaw: string | null = null
let cache: string[] = EMPTY
function getSnapshot(): string[] {
  const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY)
  if (raw !== cacheRaw) {
    cacheRaw = raw
    cache = read()
  }
  return cache
}

/** Board ids this device has opened, most-recently-opened first. */
export function useOpenedBoardIds(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY)
}
