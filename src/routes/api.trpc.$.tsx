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
    createContext: () => ({ user: request.headers.get('x-auth-user') ?? null }),
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