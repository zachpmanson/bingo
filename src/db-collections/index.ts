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
  sharingId: z.uuidv4(),
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

type ChannelMessage =
  | { kind: 'batch'; envelopes: StreamEnvelope[] }
  | { kind: 'snapshot-request'; replyTo: string }
  | { kind: 'snapshot'; to: string; envelopes: StreamEnvelope[] }

type SyncCallbacks = {
  begin: () => void
  write: (op: { type: 'insert' | 'update'; value: Board } | { type: 'delete'; key: string }) => void
  commit: () => void
  markReady: () => void
}

const applyBatch = (
  envelopes: StreamEnvelope[],
  { begin, write, commit }: Pick<SyncCallbacks, 'begin' | 'write' | 'commit'>,
) => {
  if (envelopes.length === 0) return
  try {
    begin()
    for (const m of envelopes) {
      if (m.type === 'delete') write({ type: 'delete', key: m.key })
      else write({ type: m.type, value: m.value })
    }
    commit()
  } catch (e) {
    console.error('[boards sync] commit error', e)
  }
}

const streamBoards = async (
  signal: AbortSignal,
  onBatch: (envelopes: StreamEnvelope[]) => void,
) => {
  const res = await fetch('/board/live-api', { signal })
  const reader = res.body?.getReader()
  if (!reader) return
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    const envelopes = lines
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as StreamEnvelope)
    if (envelopes.length > 0) onBatch(envelopes)
  }
}

const sharedSync = (cb: SyncCallbacks) => {
  const ctrl = new AbortController()
  const channel = new BroadcastChannel('boards-sync')
  const replyId = crypto.randomUUID()
  let ready = false
  const ensureReady = () => {
    if (ready) return
    ready = true
    cb.markReady()
  }

  // Leader maintains an authoritative mirror so it can answer snapshot-requests.
  const leaderState = new Map<string, Board>()
  let isLeader = false

  channel.addEventListener('message', (e: MessageEvent<ChannelMessage>) => {
    const msg = e.data
    if (isLeader) {
      if (msg.kind === 'snapshot-request') {
        const envelopes: StreamEnvelope[] = Array.from(
          leaderState.values(),
        ).map((value) => ({ type: 'insert', value }))
        channel.postMessage({
          kind: 'snapshot',
          to: msg.replyTo,
          envelopes,
        } satisfies ChannelMessage)
      }
      return
    }
    if (msg.kind === 'batch') {
      applyBatch(msg.envelopes, cb)
      ensureReady()
    } else if (msg.kind === 'snapshot' && msg.to === replyId) {
      applyBatch(msg.envelopes, cb)
      ensureReady()
    }
  })

  // Followers ask whoever is leader for a starting snapshot. Harmless if no leader yet.
  channel.postMessage({
    kind: 'snapshot-request',
    replyTo: replyId,
  } satisfies ChannelMessage)

  navigator.locks
    .request(
      'boards-sync-leader',
      { signal: ctrl.signal },
      () =>
        new Promise<void>((resolve) => {
          isLeader = true
          ctrl.signal.addEventListener('abort', () => resolve(), { once: true })

          streamBoards(ctrl.signal, (envelopes) => {
            for (const m of envelopes) {
              if (m.type === 'delete') leaderState.delete(m.key)
              else leaderState.set(m.value.id, m.value)
            }
            applyBatch(envelopes, cb)
            channel.postMessage({
              kind: 'batch',
              envelopes,
            } satisfies ChannelMessage)
            ensureReady()
          }).catch((err) => {
            if (!ctrl.signal.aborted) console.error('boards sync error', err)
            resolve()
          })
        }),
    )
    .catch((err) => {
      if (!ctrl.signal.aborted) console.error('boards lock error', err)
    })

  return () => {
    ctrl.abort()
    channel.close()
  }
}

const fallbackSync = (cb: SyncCallbacks) => {
  const ctrl = new AbortController()
  let ready = false
  streamBoards(ctrl.signal, (envelopes) => {
    applyBatch(envelopes, cb)
    if (!ready) {
      ready = true
      cb.markReady()
    }
  }).catch((err) => {
    if (!ctrl.signal.aborted) console.error('boards sync error', err)
  })
  return () => ctrl.abort()
}

export const boardsCollection = createCollection({
  id: 'boards',
  getKey: (board) => board.id,
  schema: BoardSchema,
  sync: {
    rowUpdateMode: 'full',
    sync: (cb) => {
      const supported =
        typeof BroadcastChannel !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        'locks' in navigator
      return supported ? sharedSync(cb) : fallbackSync(cb)
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
