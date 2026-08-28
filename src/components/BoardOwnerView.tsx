import { useAllBoards, useBoards } from '#/hooks/useBoard.ts';
import { useClipboard } from '#/hooks/useClipboard.ts';
import { basicBoardTitle, editTarget } from '#/lib/utils.ts';
import { useCurrentUser } from '#/integrations/trpc/auth';
import { useEffect } from 'react';
import Button from './Button';

// Static (non-playable) view of a board for its owner: shows the items and a
// share link. Works for both board kinds — for a shuffled board the share link
// generates a fresh random board on every open; for a fixed board it generates
// a copy. This is where you land after creating a shuffled board.
export default function BoardOwnerView({ uuid }: { uuid: string }) {
  const board = useBoards(uuid);
  const allBoards = useAllBoards();
  const user = useCurrentUser();
  const { share, copiedKey } = useClipboard();

  // Resolve the parent template for a generated child so Edit sends the owner
  // to the template editor (the source of truth), not the manage view of a draw.
  const parent = board?.parentId
    ? allBoards.find((b) => b.id === board.parentId)
    : undefined;

  useEffect(() => {
    if (board?.name) document.title = basicBoardTitle(board);
  }, [board?.name]);

  if (!board) return <div className="p-4">Loading...</div>;

  // This manage surface is for the board's creator. An owned board belongs to a
  // different account than the current one — show a fork affordance instead so
  // the visitor gets their own editable copy, never another's config.
  if (board.owner && board.owner !== user) {
    return (
      <div className="p-4 flex flex-col items-center gap-3">
        <span className="text-xl" style={{ fontFamily: "'Impact','Anton', Impact, sans-serif" }}>
          {board.name}
        </span>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          This board belongs to another account ({board.owner}). You can make
          your own copy of it to edit.
        </p>
        <Button to={'/board/$uuid/fork'} params={{ uuid: board.id }}>
          Fork a Copy
        </Button>
      </div>
    );
  }

  const isShuffled = board.kind === 'shuffled';
  const summary = isShuffled
    ? `${board.cells.length} items → ${board.size}×${board.size} (each link draws a random ${board.size * board.size})`
    : `${board.size}×${board.size}`;

  // This manage surface IS the /board/$uuid/edit destination, so an Edit button
  // that would land right back here is pointless — hide it (e.g. a plain fixed
  // board with no template to edit). Children with an owned parent point at the
  // parent's template editor; shuffled boards at their own template editor.
  const editGoesTo = editTarget(board, parent, user);
  const editIsSelfLoop =
    editGoesTo.to === '/board/$uuid/edit' &&
    editGoesTo.params.uuid === board.id;

  return (
    <div className="py-4 px-4 flex flex-col gap-4 items-center">
      <span
        className="border-solid p-2 text-2xl"
        style={{ fontFamily: "'Impact','Anton', Impact, sans-serif" }}
      >
        {board.name}
      </span>
      <p className="text-sm text-gray-600">{summary}</p>
      <p className="text-sm text-gray-600">
        {board.childCount === 0
          ? 'No boards generated yet'
          : `${board.childCount} board${board.childCount === 1 ? '' : 's'} generated`}
      </p>
      <div className="flex justify-center gap-2">
        <Button
          onClick={() =>
            void share(
              'copy',
              `${window.location.origin}/share/${board.sharingId}`,
              { title: board.name },
            )
          }
        >
          {copiedKey === 'copy' ? 'Copied!' : 'Copy Random Link'}
        </Button>
        {!editIsSelfLoop && (
          <Button
            to={editGoesTo.to}
            params={editGoesTo.params}
          >
            Edit
          </Button>
        )}
      </div>
      <ul className="flex flex-col gap-1 w-full max-w-[70ch]">
        {[...board.cells].reverse().map((cell, reversedIndex) => (
          <li
            key={board.cells.length - 1 - reversedIndex}
            className="border border-black border-solid p-2 bg-white"
          >
            {cell.text || <span className="text-gray-400">(empty)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
