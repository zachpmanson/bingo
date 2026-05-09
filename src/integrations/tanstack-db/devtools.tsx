import { useEffect, useState } from 'react'

import { boardsCollection, messagesCollection } from '#/db-collections'

import type { Collection } from '@tanstack/react-db'

const collections: Record<string, Collection<any, any, any>> = {
  boards: boardsCollection,
  messages: messagesCollection,
}

function CollectionView({
  name,
  collection,
}: {
  name: string
  collection: Collection<any, any, any>
}) {
  const [items, setItems] = useState<Array<unknown>>(() => [
    ...collection.state.values(),
  ])

  useEffect(() => {
    const sync = () => setItems([...collection.state.values()])
    sync()
    const sub = collection.subscribeChanges(sync)
    return () => sub.unsubscribe()
  }, [collection])

  return (
    <details open style={{ marginBottom: 12 }}>
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 600,
          fontFamily: 'ui-monospace, monospace',
        }}
      >
        {name} ({items.length})
      </summary>
      <pre
        style={{
          fontSize: 11,
          background: 'rgba(0,0,0,0.05)',
          padding: 8,
          marginTop: 4,
          maxHeight: 320,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(items, null, 2)}
      </pre>
    </details>
  )
}

function DBDevtoolsPanel() {
  return (
    <div style={{ padding: 12, fontFamily: 'ui-sans-serif, system-ui' }}>
      {Object.entries(collections).map(([name, collection]) => (
        <CollectionView key={name} name={name} collection={collection} />
      ))}
    </div>
  )
}

export default {
  name: 'Tanstack DB',
  render: <DBDevtoolsPanel />,
}
