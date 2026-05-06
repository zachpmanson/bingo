import { eq, useLiveQuery } from '@tanstack/react-db'
import { useEffect, useRef } from 'react'

import { boardsCollection, type Board, type Cell } from '#/db-collections'

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

  const createBoard = (size: number, name: string, cells: Cell[]) => {
    fetch('/board/create', {
      method: 'POST',
      body: JSON.stringify({ size, name, cells }),
    })
  }

  return { sendCheck, createBoard }
}

export function useBoards(uuid: string) {
  const { data: board } = useLiveQuery((q) =>
    q
      .from({ board: boardsCollection })
      .findOne()
      .where((board) => eq(board.board.id, uuid)),
  )

  return board as Board
}

// Hook to get all boards
export function useAllBoards() {
  const { data: boards } = useLiveQuery((q) =>
    q.from({ board: boardsCollection }).select(({ board }) => board),
  )

  return boards
}
