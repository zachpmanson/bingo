import { z } from 'zod'

import { BoardSchema } from '#/db-collections'
import { serverBoardsCollection } from '#/server/boards'

import { createTRPCRouter, publicProcedure } from './init'

import type { TRPCRouterRecord } from '@trpc/server'

const todos = [
  { id: 1, name: 'Get groceries' },
  { id: 2, name: 'Buy a new phone' },
  { id: 3, name: 'Finish the project' },
]

const todosRouter = {
  list: publicProcedure.query(() => todos),
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      const newTodo = { id: todos.length + 1, name: input.name }
      todos.push(newTodo)
      return newTodo
    }),
} satisfies TRPCRouterRecord

const boardsRouter = {
  create: publicProcedure
    .input(BoardSchema)
    .output(BoardSchema)
    .mutation(({ input }) => {
      serverBoardsCollection.insert(input)
      return input
    }),
  update: publicProcedure
    .input(BoardSchema)
    .output(BoardSchema)
    .mutation(({ input }) => {
      serverBoardsCollection.update(input.id, (draft) => {
        Object.assign(draft, input)
      })
      return input
    }),
  setCell: publicProcedure
    .input(
      z.object({
        boardId: z.string(),
        cellId: z.number().int().nonnegative(),
        checked: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      serverBoardsCollection.update(input.boardId, (draft) => {
        draft.cells[input.cellId].checked = input.checked
      })
    }),
} satisfies TRPCRouterRecord

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
  boards: boardsRouter,
})
export type TRPCRouter = typeof trpcRouter
