import { createFileRoute } from '@tanstack/react-router'

import { serverBoardsCollection } from '#/server/boards'

export const Route = createFileRoute('/board/live-api')({
  server: {
    handlers: {
      GET: () => {
        const tag = `[live-api ${Math.random().toString(36).slice(2, 7)}]`
        console.log(
          `${tag} GET connected — collection has ${serverBoardsCollection.state.size} boards`,
        )
        let unsubscribe: (() => void) | undefined
        let heartbeat: ReturnType<typeof setInterval>
        const encoder = new TextEncoder()
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            let closed = false
            const safeEnqueue = (line: string) => {
              if (closed) return
              try {
                controller.enqueue(encoder.encode(line))
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
            heartbeat = setInterval(() => {
              console.log(`${tag} heartbeat tick`)
              safeEnqueue(JSON.stringify({ type: 'ping' }) + '\n')
            }, 1000)
            unsubscribe = serverBoardsCollection.subscribeChanges((changes) => {
              console.log(`${tag} subscribeChanges fired:`, changes.length, 'change(s)')
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
            console.log(`${tag} stream cancelled`)
            clearInterval(heartbeat)
            unsubscribe?.()
          },
        })

        return new Response(stream, {
          headers: {
            'Content-Type': 'application/x-ndjson',
            'Cache-Control': 'no-cache, no-transform',
            'Content-Encoding': 'identity',
            'X-Accel-Buffering': 'no',
          },
        })
      },
    },
  },
})
