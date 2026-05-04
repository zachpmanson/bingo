import { useLiveQuery } from '@tanstack/react-db'
import { useEffect, useRef } from 'react'

import { boardsCollection, type Board } from '#/db-collections'

import type { Collection } from '@tanstack/react-db'

function useStreamConnection(
  url: string,
  collection: Collection<any, any, any>,
) {
  const loadedRef = useRef(false)

  useEffect(() => {
    const fetchData = async () => {
      if (loadedRef.current) return
      loadedRef.current = true

      const response = await fetch(url)
      const reader = response.body?.getReader()
      if (!reader) {
        return
      }

      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const chunk of decoder
          .decode(value, { stream: true })
          .split('\n')
          .filter((chunk) => chunk.length > 0)) {
          collection.insert(JSON.parse(chunk))
        }
      }
    }
    fetchData()
  }, [])
}

export function useBoardsStream() {
  useStreamConnection('/board/live-api', boardsCollection)

  const sendCheck = (boardId: string, cellId: number, checked: boolean) => {
    fetch('/board/live-api', {
      method: 'POST',
      body: JSON.stringify({ boardId, cellId, checked }),
    })
  }

  return { sendCheck: sendCheck }
}

export function useBoards(uuid: string) {
  const { data: board } = useLiveQuery(
    (q) =>
      q
        .from({ board: boardsCollection })
        .findOne()
        .where((board) => board.board.id === uuid),
    // .select(({ board }) => ({
    // ...board,
    // })),
  )

  return board as Board
}
