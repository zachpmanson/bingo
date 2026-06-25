import type { ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import superjson from 'superjson';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';

import { TRPCProvider } from '#/integrations/trpc/react';
import { trpcClient } from '#/integrations/trpc/client';

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      dehydrate: { serializeData: superjson.serialize },
      hydrate: { deserializeData: superjson.deserialize },
    },
  });

  const serverHelpers = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient: queryClient,
  });
  const context = {
    queryClient,
    trpc: serverHelpers,
  };

  return context;
}

export default function TanstackQueryProvider({
  children,
  context,
}: {
  children: ReactNode;
  context: ReturnType<typeof getContext>;
}) {
  const { queryClient } = context;

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  );
}
