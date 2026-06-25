import {
  createCollection,
  localOnlyCollectionOptions,
} from '@tanstack/react-db';
import { z } from 'zod';

import { trpcClient } from '#/integrations/trpc/client';

const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  user: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

export const messagesCollection = createCollection(
  localOnlyCollectionOptions({
    getKey: (message) => message.id,
    schema: MessageSchema,
  }),
);

export const CellSchema = z.object({
  text: z.string(),
  checked: z.boolean(),
});

export const BoardSchema = z.object({
  id: z.uuidv4(),
  sharingId: z.uuidv4(),
  name: z.string(),
  size: z.number(),
  // 'fixed': cells are a locked size×size grid (the original board kind).
  // 'shuffled': cells are an item pool of >= size² entries; each share link
  // generates a random size² subset. Defaults to 'fixed' so pre-existing
  // persisted boards (without this field) load unchanged.
  kind: z.enum(['fixed', 'shuffled']).default('fixed'),
  // How many boards have been generated from this one via its share link
  // (copies of a fixed board, random draws of a shuffled board).
  childCount: z.number().default(0),
  // For a generated board: which child of its source it is, 1-based. Absent on
  // boards created directly from the editor.
  childIndex: z.number().optional(),
  // The id of the board this was generated from. Absent on boards created
  // directly from the editor.
  parentId: z.uuidv4().optional(),
  cells: z.array(CellSchema),
});

export type Board = z.infer<typeof BoardSchema>;
export type Cell = z.infer<typeof CellSchema>;

type StreamEnvelope =
  | { type: 'insert'; value: Board }
  | { type: 'update'; value: Board }
  | { type: 'delete'; key: string };

type ChannelMessage =
  | { kind: 'batch'; envelopes: StreamEnvelope[] }
  | { kind: 'snapshot-request'; replyTo: string }
  | { kind: 'snapshot'; to: string; envelopes: StreamEnvelope[] };

type SyncCallbacks = {
  begin: () => void;
  write: (
    op:
      | { type: 'insert' | 'update'; value: Board }
      | { type: 'delete'; key: string },
  ) => void;
  commit: () => void;
  markReady: () => void;
};

const applyBatch = (
  envelopes: StreamEnvelope[],
  { begin, write, commit }: Pick<SyncCallbacks, 'begin' | 'write' | 'commit'>,
) => {
  if (envelopes.length === 0) return;
  try {
    begin();
    for (const m of envelopes) {
      if (m.type === 'delete') {
        write({ type: 'delete', key: m.key });
      } else {
        // The server resends a full snapshot of `insert` envelopes on every
        // (re)connection — reconnect, leader handoff, follower snapshot — so a
        // board we already hold arrives as an `insert`. Derive the op from local
        // state instead of trusting the envelope label; otherwise tanstack-db
        // rejects the duplicate key whenever the value changed while we were away.
        const type = boardsCollection.has(m.value.id) ? 'update' : 'insert';
        write({ type, value: m.value });
      }
    }
    commit();
  } catch (e) {
    console.error('[boards sync] commit error', e);
  }
};

const MAX_BACKOFF_MS = 15000;

const isVisible = () =>
  typeof document === 'undefined' || document.visibilityState === 'visible';

// Resolves after `ms`, or early when the app returns to the foreground / regains
// network — so a dropped connection recovers immediately on resume.
const reconnectDelay = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    if (ms <= 0 || signal.aborted) return resolve();
    const wake = () => {
      cleanup();
      resolve();
    };
    const onVisible = () => {
      if (isVisible()) wake();
    };
    const timer = setTimeout(wake, ms);
    const cleanup = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', wake);
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', onVisible);
      if (typeof window !== 'undefined')
        window.removeEventListener('online', wake);
    };
    signal.addEventListener('abort', wake, { once: true });
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', onVisible);
    if (typeof window !== 'undefined') window.addEventListener('online', wake);
  });

// Read one NDJSON stream until it ends, errors, or `signal` aborts.
const readStream = async (
  signal: AbortSignal,
  onBatch: (envelopes: StreamEnvelope[]) => void,
) => {
  const res = await fetch('/board/live-api', { signal });
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    const envelopes = lines
      .filter((l) => l.length > 0)
      .map((l) => JSON.parse(l) as StreamEnvelope);
    if (envelopes.length > 0) onBatch(envelopes);
  }
};

const streamBoards = async (
  signal: AbortSignal,
  onBatch: (envelopes: StreamEnvelope[]) => void,
) => {
  let backoff = 1000;
  while (!signal.aborted) {
    // Per-connection controller: lets us drop a (possibly stalled) stream on
    // resume without tearing down the whole sync.
    const conn = new AbortController();
    const abortConn = () => conn.abort();
    // Mobile browsers freeze background fetches; force a fresh connection when
    // the app comes back to the foreground or the network returns.
    const onVisible = () => {
      if (isVisible()) abortConn();
    };
    signal.addEventListener('abort', abortConn, { once: true });
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', onVisible);
    if (typeof window !== 'undefined')
      window.addEventListener('online', abortConn);

    try {
      await readStream(conn.signal, onBatch);
      backoff = 1000;
    } catch (err) {
      if (signal.aborted) return;
      if (!conn.signal.aborted) console.error('boards stream error', err);
    } finally {
      signal.removeEventListener('abort', abortConn);
      if (typeof document !== 'undefined')
        document.removeEventListener('visibilitychange', onVisible);
      if (typeof window !== 'undefined')
        window.removeEventListener('online', abortConn);
    }

    if (signal.aborted) return;
    await reconnectDelay(isVisible() ? 0 : backoff, signal);
    backoff = Math.min(backoff * 2, MAX_BACKOFF_MS);
  }
};

// If leadership can't be acquired and no data arrives within this window, assume
// the lock is wedged (e.g. a frozen/bfcached page on mobile still holds it after
// a refresh) and stream directly so we never hang on the loading screen.
const RESCUE_TIMEOUT_MS = 1500;

const sharedSync = (cb: SyncCallbacks) => {
  const channel = new BroadcastChannel('boards-sync');
  const replyId = crypto.randomUUID();
  let destroyed = false;
  let ready = false;

  // Leader maintains an authoritative mirror so it can answer snapshot-requests.
  const leaderState = new Map<string, Board>();
  let isLeader = false;
  // Controls the current leadership attempt; null when not leading/trying.
  let leaderCtrl: AbortController | null = null;

  // Rescue: a direct fallback stream, used only if we can neither acquire the
  // lock nor hear from a leader (e.g. the lock was never released).
  const rescue = new AbortController();
  let rescuing = false;
  const startRescue = () => {
    if (rescuing || isLeader || destroyed) return;
    rescuing = true;
    void streamBoards(rescue.signal, (envelopes) => {
      applyBatch(envelopes, cb);
      ensureReady();
    }).catch((err) => {
      if (!rescue.signal.aborted) console.error('boards rescue error', err);
    });
  };
  let rescueTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(
    startRescue,
    RESCUE_TIMEOUT_MS,
  );

  const ensureReady = () => {
    if (rescueTimer !== undefined) {
      clearTimeout(rescueTimer);
      rescueTimer = undefined;
    }
    if (ready) return;
    ready = true;
    cb.markReady();
  };

  channel.addEventListener('message', (e: MessageEvent<ChannelMessage>) => {
    const msg = e.data;
    if (isLeader) {
      if (msg.kind === 'snapshot-request') {
        const envelopes: StreamEnvelope[] = Array.from(
          leaderState.values(),
        ).map((value) => ({ type: 'insert', value }));
        channel.postMessage({
          kind: 'snapshot',
          to: msg.replyTo,
          envelopes,
        } satisfies ChannelMessage);
      }
      return;
    }
    if (msg.kind === 'batch') {
      applyBatch(msg.envelopes, cb);
      ensureReady();
    } else if (msg.kind === 'snapshot' && msg.to === replyId) {
      applyBatch(msg.envelopes, cb);
      ensureReady();
    }
  });

  // Followers ask whoever is leader for a starting snapshot. Harmless if no leader yet.
  channel.postMessage({
    kind: 'snapshot-request',
    replyTo: replyId,
  } satisfies ChannelMessage);

  // Try to become the single upstream streamer. Re-runnable: called again on
  // focus so a page that couldn't lead at load (e.g. a frozen/bfcached page on
  // mobile still held the lock) grabs leadership the moment it's foregrounded.
  const becomeLeader = () => {
    if (destroyed || isLeader || leaderCtrl || !isVisible()) return;
    const lc = new AbortController();
    leaderCtrl = lc;
    navigator.locks
      .request(
        'boards-sync-leader',
        { signal: lc.signal },
        () =>
          new Promise<void>((resolve) => {
            isLeader = true;
            // We're the authoritative streamer now; drop any rescue fallback.
            rescue.abort();
            lc.signal.addEventListener('abort', () => resolve(), {
              once: true,
            });

            streamBoards(lc.signal, (envelopes) => {
              for (const m of envelopes) {
                if (m.type === 'delete') leaderState.delete(m.key);
                else leaderState.set(m.value.id, m.value);
              }
              applyBatch(envelopes, cb);
              channel.postMessage({
                kind: 'batch',
                envelopes,
              } satisfies ChannelMessage);
              ensureReady();
            }).catch((err) => {
              if (!lc.signal.aborted) console.error('boards sync error', err);
              resolve();
            });
          }),
      )
      .catch((err) => {
        if (!lc.signal.aborted) console.error('boards lock error', err);
      })
      .finally(() => {
        isLeader = false;
        if (leaderCtrl === lc) leaderCtrl = null;
      });
  };

  // Release the lock when backgrounded so another foreground page — including the
  // next page after a refresh — can take over instead of waiting on us.
  const releaseLeader = () => {
    leaderCtrl?.abort();
  };

  const onForeground = () => becomeLeader();
  const onVisibility = () => {
    if (isVisible()) becomeLeader();
    else releaseLeader();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onForeground);
    window.addEventListener('pageshow', onForeground);
    window.addEventListener('pagehide', releaseLeader);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  becomeLeader();

  return () => {
    destroyed = true;
    if (rescueTimer !== undefined) clearTimeout(rescueTimer);
    rescue.abort();
    releaseLeader();
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onForeground);
      window.removeEventListener('pageshow', onForeground);
      window.removeEventListener('pagehide', releaseLeader);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
    channel.close();
  };
};

const fallbackSync = (cb: SyncCallbacks) => {
  const ctrl = new AbortController();
  let ready = false;
  streamBoards(ctrl.signal, (envelopes) => {
    applyBatch(envelopes, cb);
    if (!ready) {
      ready = true;
      cb.markReady();
    }
  }).catch((err) => {
    if (!ctrl.signal.aborted) console.error('boards sync error', err);
  });
  return () => ctrl.abort();
};

export const boardsCollection = createCollection({
  id: 'boards',
  getKey: (board) => board.id,
  schema: BoardSchema,
  sync: {
    rowUpdateMode: 'full',
    sync: (cb) => {
      // Browser-only. This sync streams from /board/live-api over fetch and
      // coordinates tabs via BroadcastChannel/Web Locks; none of that belongs
      // on the server. If it starts during SSR the server fetches its own
      // never-ending stream endpoint and the request handler deadlocks.
      if (typeof window === 'undefined') {
        cb.markReady();
        return () => {};
      }
      const supported =
        typeof BroadcastChannel !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        'locks' in navigator;
      return supported ? sharedSync(cb) : fallbackSync(cb);
    },
  },
  onInsert: async ({ transaction }) => {
    for (const m of transaction.mutations) {
      await trpcClient.boards.create.mutate(m.modified);
    }
  },
  onUpdate: async ({ transaction }) => {
    for (const m of transaction.mutations) {
      // A play-time checkbox toggle changes only `cells[i].checked`; an owner
      // edit changes board content (name/size/kind/cell text/the cell array).
      // Detect content edits and persist the whole board; otherwise stream the
      // individual cell toggles as before.
      const sameStructure =
        m.modified.name === m.original.name &&
        m.modified.size === m.original.size &&
        m.modified.kind === m.original.kind &&
        m.modified.cells.length === m.original.cells.length;
      const onlyCheckedChanged =
        sameStructure &&
        m.modified.cells.every(
          (cell, i) => cell.text === m.original.cells[i].text,
        );

      if (onlyCheckedChanged) {
        m.modified.cells.forEach((cell, i) => {
          if (cell.checked !== m.original.cells[i].checked) {
            trpcClient.boards.setCell.mutate({
              boardId: m.modified.id,
              cellId: i,
              checked: cell.checked,
            });
          }
        });
      } else {
        await trpcClient.boards.update.mutate(m.modified);
      }
    }
  },
});
