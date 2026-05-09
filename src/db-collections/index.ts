import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'
import { z } from 'zod'

import { trpcClient } from '#/integrations/trpc/client'

const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  user: z.string(),
})

export type Message = z.infer<typeof MessageSchema>

export const messagesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (message) => message.id,
    schema: MessageSchema,
  }),
)

export const CellSchema = z.object({
  text: z.string(),
  checked: z.boolean(),
})

export const BoardSchema = z.object({
  id: z.uuidv4(),
  name: z.string(),
  size: z.number(),
  cells: z.array(CellSchema),
})

export type Board = z.infer<typeof BoardSchema>
export type Cell = z.infer<typeof CellSchema>

type StreamEnvelope =
  | { type: 'insert'; value: Board }
  | { type: 'update'; value: Board }
  | { type: 'delete'; key: string }

export const boardsCollection = createCollection({
  id: 'boards',
  getKey: (board) => board.id,
  schema: BoardSchema,
  sync: {
    rowUpdateMode: 'full',
    sync: ({ begin, write, commit, markReady }) => {
      const ctrl = new AbortController()
      ;(async () => {
        const res = await fetch('/board/live-api', { signal: ctrl.signal })
        const reader = res.body?.getReader()
        if (!reader) {
          markReady()
          return
        }
        const decoder = new TextDecoder()
        let buffer = ''
        let firstBatch = true
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''
          const messages = lines
            .filter((l) => l.length > 0)
            .map((l) => JSON.parse(l) as StreamEnvelope)
          if (messages.length === 0) continue
          begin()
          for (const m of messages) {
            if (m.type === 'delete') {
              write({ type: 'delete', key: m.key })
            } else {
              write({ type: m.type, value: m.value })
            }
          }
          commit()
          if (firstBatch) {
            firstBatch = false
            markReady()
          }
        }
      })().catch((err) => {
        if (!ctrl.signal.aborted) console.error('boards sync error', err)
      })
      return () => ctrl.abort()
    },
  },
  onInsert: async ({ transaction }) => {
    for (const m of transaction.mutations) {
      await trpcClient.boards.create.mutate(m.modified)
    }
  },
  onUpdate: async ({ transaction }) => {
    for (const m of transaction.mutations) {
      m.modified.cells.forEach((cell, i) => {
        if (cell.checked !== m.original.cells[i].checked) {
          trpcClient.boards.setCell.mutate({
            boardId: m.modified.id,
            cellId: i,
            checked: cell.checked,
          })
        }
      })
    }
  },
})
