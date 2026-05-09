import { createFileRoute } from '@tanstack/react-router'

import type { Board } from '#/db-collections'
import { findBoardBySharingId, serverBoardsCollection } from '#/server/boards'

export const Route = createFileRoute('/share/$uuid')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const source = findBoardBySharingId(params.uuid)
        if (!source) return new Response('Shared board not found', { status: 404 })
        const copy: Board = {
          ...source,
          id: crypto.randomUUID(),
          sharingId: crypto.randomUUID(),
          cells: source.cells.map((c) => ({ text: c.text, checked: false })),
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
