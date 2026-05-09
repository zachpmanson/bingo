import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'
import { z } from 'zod'

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

export const boardsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (board) => board.id,
    schema: BoardSchema,
  }),
)
