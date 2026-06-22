import { createFileRoute } from '@tanstack/react-router'

import type { Board } from '#/db-collections'
import { randomBoardCells } from '#/lib/bingo.ts'
import { findBoardBySharingId, serverBoardsCollection } from '#/server/boards'

export const Route = createFileRoute('/share/$uuid')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const source = findBoardBySharingId(params.uuid)
        if (!source) return new Response('Shared board not found', { status: 404 })
        // A shuffled board's pool yields a random size² subset; a fixed board is
        // copied verbatim. Either way the generated board is a normal, playable
        // 'fixed' board.
        const cells =
          source.kind === 'shuffled'
            ? randomBoardCells(source.cells, source.size)
            : source.cells.map((c) => ({ text: c.text, checked: false }))
        const copy: Board = {
          ...source,
          kind: 'fixed',
          id: crypto.randomUUID(),
          sharingId: crypto.randomUUID(),
          cells,
        }
        serverBoardsCollection.insert(copy)
        return new Response(null, {
          status: 302,
          headers: { Location: `/board/${copy.id}` },
        })
      },
    },
  },
})
