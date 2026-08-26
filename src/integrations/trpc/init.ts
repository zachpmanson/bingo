import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

// Trust-the-edge identity context, mirrors spells. Caddy authenticates via HTTP
// Basic auth and stamps the upstream request with X-Auth-User naming who
// logged in (the basicauth username). bingo knows nothing about passwords or
// sessions — it trusts that header because Caddy is its ONLY ingress (the
// service binds loopback-only; see the nix module). Anonymous requests carry no
// header, so user is null.
//
// `owner` (claimed on boards) is compared against this forwarded identity. The
// owner column is set server-side from user on create, never taken verbatim from
// the client payload.
export interface UserContext {
  user: string | null;
}

const t = initTRPC.context<UserContext>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;