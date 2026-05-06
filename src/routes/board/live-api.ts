import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'

import { BoardSchema, CellSchema } from '#/db-collections/index.ts'
import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'
import { z } from 'zod'

const IncomingBoardSchema = z.object({
  name: z.string(),
  size: z.number(),
  cells: z.array(CellSchema),
})

export const serverMessagesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (message) => message.id,
    schema: BoardSchema,
  }),
)

let id = 0
serverMessagesCollection.insert({
  id: uuidv,
  user: 'Alice',
  text: 'Hello, how are you?',
})
serverMessagesCollection.insert({
  id: id++,
  user: 'Bob',
  text: "I'm fine, thank you!",
})

const sendMessage = (message: { user: string; text: string }) => {
  serverMessagesCollection.insert({
    id: id++,
    user: message.user,
    text: message.text,
  })
}

export const Route = createFileRoute('/board/live-api')({
  server: {
    handlers: {
      GET: () => {
        const stream = new ReadableStream({
          start(controller) {
            for (const [_id, message] of serverMessagesCollection.state) {
              controller.enqueue(JSON.stringify(message) + '\n')
            }
            serverMessagesCollection.subscribeChanges((changes) => {
              for (const change of changes) {
                if (change.type === 'insert') {
                  controller.enqueue(JSON.stringify(change.value) + '\n')
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
      POST: async ({ request }) => {
        const message = IncomingMessageSchema.safeParse(await request.json())
        if (!message.success) {
          return new Response(message.error.message, { status: 400 })
        }
        sendMessage(message.data)
        return json(message.data)
      },
    },
  },
})
