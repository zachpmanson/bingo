import { createFileRoute } from '@tanstack/react-router'

import { serverBoardsCollection } from '#/server/boards'

export const Route = createFileRoute('/board/live-api')({
  server: {
    handlers: {
      GET: () => {
        const stream = new ReadableStream({
          start(controller) {
            for (const [_id, board] of serverBoardsCollection.state) {
              controller.enqueue(
                JSON.stringify({ type: 'insert', value: board }) + '\n',
              )
            }
            serverBoardsCollection.subscribeChanges((changes) => {
              for (const change of changes) {
                if (change.type === 'delete') {
                  controller.enqueue(
                    JSON.stringify({ type: 'delete', key: change.key }) + '\n',
                  )
                } else {
                  controller.enqueue(
                    JSON.stringify({
                      type: change.type,
                      value: change.value,
                    }) + '\n',
                  )
                }
              }
            })
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
