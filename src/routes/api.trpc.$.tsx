import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { trpcRouter } from '#/integrations/trpc/router';
import { createFileRoute } from '@tanstack/react-router';

function handler({ request }: { request: Request }) {
  return fetchRequestHandler({
    req: request,
    router: trpcRouter,
    endpoint: '/api/trpc',
    // Trust-the-edge: the identity comes from the X-Auth-User header Caddy
    // stamps for authenticated requests (null on anonymous). The app never
    // parses credentials itself.
    // `guest` is the reserved sign-out account (edge-auth pattern): Caddy
    // accepts it so the browser can silently swap to it (no 401 prompt), but
    // to the app guest === anonymous — map it to null so every downstream
    // check (whoami, owner-gating) treats it as signed out.
    createContext: () => {
      const raw = request.headers.get('x-auth-user');
      return { user: raw === 'guest' ? null : raw };
    },
  });
}

export const Route = createFileRoute('/api/trpc/$')({
  server: {
    handlers: {
      GET: handler,
      POST: handler,
    },
  },
});