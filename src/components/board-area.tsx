import { useMessages } from '#/hooks/demo.useChat'

import { useBoards, useBoardsStream } from '#/hooks/useBoard.ts'

export default function BoardArea({ uuid }: { uuid: string }) {
  const { sendCheck } = useBoardsStream()
  const board = useBoards(uuid)
  const messages = useMessages()

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      postCheck()
    }
  }

  return (
    <>
      <div className="px-4 py-6 space-y-4"></div>
    </>
  )
}
