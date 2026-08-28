import type { ClassValue } from 'clsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Board } from '../db-collections';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hasItems<T>(arr: T[] | undefined | null): boolean {
  return !!(arr && arr.length > 0);
}

export function basicBoardTitle(b: Board) {
  if (b.kind === 'fixed' && b.childIndex) {
    return `${b.name} #${b.childIndex}`;
  }
  if (b.kind === 'shuffled') {
    return `${b.name} Template`;
  }
  return b.name;
}

export function detailedSuffix(b: Board) {
  if (b.kind === 'fixed' && b.childIndex) {
    return `#${b.childIndex} (${b.size}x${b.size})`;
  }
  if (b.kind === 'shuffled') {
    return `Template (${b.cells.length} options)`;
  }
  return `(${b.size}x${b.size})`;
}

// Where the owner's Edit button should send them for a board they own.
// A generated child board belongs to its parent template: for the template's
// owner, editing it means editing the template (the source of truth), not the
// fixed draw they're looking at — so a child redirects to the parent's
// template editor. A shuffled board is itself a template, so it goes straight
// to its own template editor. Everything else falls back to the manage view.
export function editTarget(
  board: Board,
  parent: Board | undefined,
  user: string | null | undefined,
): {
  to: '/board/$uuid/edit' | '/board/$uuid/edit-template';
  params: { uuid: string };
} {
  if (board.parentId && parent?.owner && parent.owner === user) {
    return { to: '/board/$uuid/edit-template', params: { uuid: parent.id } };
  }
  if (board.kind === 'shuffled') {
    return { to: '/board/$uuid/edit-template', params: { uuid: board.id } };
  }
  return { to: '/board/$uuid/edit', params: { uuid: board.id } };
}
