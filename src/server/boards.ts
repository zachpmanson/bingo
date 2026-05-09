import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db'

import { BoardSchema, type Board } from '#/db-collections'

const DB_PATH = resolve(process.env.BOARDS_DB ?? '.data/boards.sqlite')
mkdirSync(dirname(DB_PATH), { recursive: true })

const db = new DatabaseSync(DB_PATH)
db.exec(`
  CREATE TABLE IF NOT EXISTS boards (
    id   TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )
`)

const upsertStmt = db.prepare(
  'INSERT OR REPLACE INTO boards (id, data) VALUES (?, ?)',
)
const deleteStmt = db.prepare('DELETE FROM boards WHERE id = ?')
const selectAllStmt = db.prepare('SELECT data FROM boards')

export const serverBoardsCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (board) => board.id,
    schema: BoardSchema,
  }),
)

for (const row of selectAllStmt.all() as Array<{ data: string }>) {
  serverBoardsCollection.insert(JSON.parse(row.data) as Board)
}

serverBoardsCollection.subscribeChanges((changes) => {
  for (const change of changes) {
    if (change.type === 'delete') {
      deleteStmt.run(change.key)
    } else {
      upsertStmt.run(change.value.id, JSON.stringify(change.value))
    }
  }
})
