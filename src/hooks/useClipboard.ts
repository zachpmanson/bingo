import { useEffect, useRef, useState } from 'react'

export function useClipboard(resetMs = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const share = async (
    key: string,
    url: string,
    options?: { title?: string },
  ) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: options?.title, url })
        return
      } catch (err) {
        if ((err as DOMException).name === 'AbortError') return
      }
    }
    await navigator.clipboard.writeText(url)
    setCopiedKey(key)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopiedKey(null), resetMs)
  }

  return { share, copiedKey }
}
