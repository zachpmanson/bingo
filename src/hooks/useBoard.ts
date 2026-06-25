import { eq, useLiveQuery } from '@tanstack/react-db';

import { boardsCollection, type Board } from '#/db-collections';

export function useBoards(uuid: string) {
  const { data: board } = useLiveQuery((q) =>
    q
      .from({ board: boardsCollection })
      .findOne()
      .where((board) => eq(board.board.id, uuid)),
  );

  return board as Board;
}

export function useAllBoards() {
  const { data: boards } = useLiveQuery((q) =>
    q.from({ board: boardsCollection }).select(({ board }) => board),
  );

  return boards;
}
