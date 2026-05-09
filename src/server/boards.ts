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

const columns = db
  .prepare('PRAGMA table_info(boards)')
  .all() as Array<{ name: string }>
if (!columns.some((c) => c.name === 'sharing_id')) {
  db.exec('ALTER TABLE boards ADD COLUMN sharing_id TEXT')
  const rows = db.prepare('SELECT id, data FROM boards').all() as Array<{
    id: string
    data: string
  }>
  const backfillStmt = db.prepare(
    'UPDATE boards SET data = ?, sharing_id = ? WHERE id = ?',
  )
  for (const row of rows) {
    const parsed = JSON.parse(row.data) as Board
    const sharingId = parsed.sharingId ?? crypto.randomUUID()
    parsed.sharingId = sharingId
    backfillStmt.run(JSON.stringify(parsed), sharingId, row.id)
  }
}
db.exec(
  'CREATE UNIQUE INDEX IF NOT EXISTS boards_sharing_id_idx ON boards(sharing_id)',
)

const upsertStmt = db.prepare(
  'INSERT OR REPLACE INTO boards (id, sharing_id, data) VALUES (?, ?, ?)',
)
const deleteStmt = db.prepare('DELETE FROM boards WHERE id = ?')
const selectAllStmt = db.prepare('SELECT data FROM boards')
const selectBySharingIdStmt = db.prepare(
  'SELECT data FROM boards WHERE sharing_id = ?',
)

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
      upsertStmt.run(
        change.value.id,
        change.value.sharingId,
        JSON.stringify(change.value),
      )
    }
  }
})

export function findBoardBySharingId(sharingId: string): Board | null {
  const row = selectBySharingIdStmt.get(sharingId) as
    | { data: string }
    | undefined
  if (!row) return null
  return JSON.parse(row.data) as Board
}
