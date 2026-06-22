import { createFileRoute } from '@tanstack/react-router'

import { serverBoardsCollection } from '#/server/boards'

export const Route = createFileRoute('/board/live-api')({
  server: {
    handlers: {
      GET: ({ request }) => {
        let subscription: { unsubscribe: () => void } | undefined
        const stream = new ReadableStream({
          start(controller) {
            let closed = false
            const close = () => {
              if (closed) return
              closed = true
              subscription?.unsubscribe()
              try {
                controller.close()
              } catch {
                // Already closed or errored — nothing to do.
              }
            }
            const safeEnqueue = (line: string) => {
              if (closed) return
              try {
                controller.enqueue(line)
              } catch {
                close()
              }
            }

            // This stream never ends on its own. Tear it down when the client
            // disconnects; otherwise the runtime aborts the in-flight response
            // and the AbortError surfaces as an unhandled 500.
            if (request.signal.aborted) {
              close()
              return
            }
            request.signal.addEventListener('abort', close, { once: true })

            for (const [_id, board] of serverBoardsCollection.state) {
              safeEnqueue(
                JSON.stringify({ type: 'insert', value: board }) + '\n',
              )
            }
            subscription = serverBoardsCollection.subscribeChanges((changes) => {
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
            subscription?.unsubscribe()
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
