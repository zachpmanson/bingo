import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { BoardSchema } from '#/db-collections';
import { serverBoardsCollection } from '#/server/boards';

import { createTRPCRouter, publicProcedure } from './init';

import type { TRPCRouterRecord } from '@trpc/server';

const todos = [
  { id: 1, name: 'Get groceries' },
  { id: 2, name: 'Buy a new phone' },
  { id: 3, name: 'Finish the project' },
];

const todosRouter = {
  list: publicProcedure.query(() => todos),
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ input }) => {
      const newTodo = { id: todos.length + 1, name: input.name };
      todos.push(newTodo);
      return newTodo;
    }),
} satisfies TRPCRouterRecord;

// Identity router: tells the client who the edge authenticated for the current
// request (or null for anonymous). Feeds the sign-in badge / login affordances.
const authRouter = {
  whoami: publicProcedure.query(({ ctx }) => ({ user: ctx.user })),
} satisfies TRPCRouterRecord;

// Returns whether a board's content is editable by the given identity. An
// owned board is editable only by its owner; an ownerless board stays open to
// anyone (pre-auth behaviour).
function assertBoardEditable(boardId: string, user: string | null): void {
  const board = serverBoardsCollection.state.get(boardId);
  if (!board) throw new TRPCError({ code: 'NOT_FOUND', message: 'Board not found' });
  if (board.owner && board.owner !== user) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Only the board owner can edit this board.',
    });
  }
}

const boardsRouter = {
  create: publicProcedure
    .input(BoardSchema)
    .output(BoardSchema)
    .mutation(({ input, ctx }) => {
      // Owner is server-authoritative: stamp it from the edge identity, never
      // trust whatever the client sent as `owner`.
      const board = { ...input, owner: ctx.user ?? undefined };
      serverBoardsCollection.insert(board);
      return board;
    }),
  update: publicProcedure
    .input(BoardSchema)
    .output(BoardSchema)
    .mutation(({ input, ctx }) => {
      // Content (config) edits are owner-gated — this is the hard server-side
      // boundary that "login prevents editing someone else's board" relies on.
      assertBoardEditable(input.id, ctx.user);
      const existing = serverBoardsCollection.state.get(input.id);
      // Preserve the board's claimed owner (or claim it for the editing user if
      // it was ownerless), keeping `owner` out of client control.
      const effectiveOwner = existing?.owner ?? ctx.user ?? undefined;
      serverBoardsCollection.update(input.id, (draft) => {
        Object.assign(draft, input, { owner: effectiveOwner });
      });
      return { ...input, owner: effectiveOwner };
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
      // Gameplay toggle — deliberately left open to everyone, it's the shared
      // multiplayer path and must not require sign-in.
      serverBoardsCollection.update(input.boardId, (draft) => {
        draft.cells[input.cellId].checked = input.checked;
      });
    }),
} satisfies TRPCRouterRecord;

export const trpcRouter = createTRPCRouter({
  todos: todosRouter,
  boards: boardsRouter,
  auth: authRouter,
});
export type TRPCRouter = typeof trpcRouter;
