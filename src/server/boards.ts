import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'

import { BoardSchema } from '#/db-collections'

export const serverBoardsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (board) => board.id,
    schema: BoardSchema,
  }),
)
