import { createFileRoute } from '@tanstack/react-router'

import { serverBoardsCollection } from '#/server/boards'

export const Route = createFileRoute('/board/live-api')({
  server: {
    handlers: {
      GET: () => {
        let unsubscribe: (() => void) | undefined
        const stream = new ReadableStream({
          start(controller) {
            let closed = false
            const safeEnqueue = (line: string) => {
              if (closed) return
              try {
                controller.enqueue(line)
              } catch {
                closed = true
                unsubscribe?.()
              }
            }
            for (const [_id, board] of serverBoardsCollection.state) {
              safeEnqueue(
                JSON.stringify({ type: 'insert', value: board }) + '\n',
              )
            }
            unsubscribe = serverBoardsCollection.subscribeChanges((changes) => {
              for (const change of changes) {
                if (change.type === 'delete') {
                  safeEnqueue(
                    JSON.stringify({ type: 'delete', key: change.key }) + '\n',
                  )
                } else {
                  safeEnqueue(
                    JSON.stringify({
                      type: change.type,
                      value: change.value,
                    }) + '\n',
                  )
                }
              }
            })
          },
          cancel() {
            unsubscribe?.()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'application/x-ndjson',
          },
        })
      },
    },
  },
})
