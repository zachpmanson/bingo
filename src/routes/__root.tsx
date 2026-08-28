import { TanStackDevtools } from '@tanstack/react-devtools';
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import TanStackDBDevtools from '../integrations/tanstack-db/devtools';
import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';

import { seo } from '#/lib/seo';

import appCss from '../styles.css?url';

import type { QueryClient } from '@tanstack/react-query';

import type { TRPCRouter } from '#/integrations/trpc/router';
import type { TRPCOptionsProxy } from '@trpc/tanstack-react-query';

interface MyRouterContext {
  queryClient: QueryClient;

  trpc: TRPCOptionsProxy<TRPCRouter>;
}

// const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      ...seo({
        description: 'Make, share, and play custom bingo boards.',
      }),
    ],
    links: [
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Edge logout navigates to a Basic-auth URL embedding the reserved
          `guest` credential so the browser signs out silently (see UserBadge
          edgeLogout). That leaves credentials in the URL, and the browser
          refuses to construct a relative fetch against a base URI carrying
          userinfo ("URL with embedded credentials" TypeError breaks every data
          request after logout). Turn any userinfo-bearing page into a clean /
          navigation the instant it parses — before any hydration fetch — so
          the base URI is clean again. The browser keeps re-sending the cached
          guest Basic credential, so the reload stays signed out. Key the check
          on document.baseURI, not location.href (the browser cleans that).
          indexOf form deliberately, not a regex: /-escapes double-escape
          through dangerouslySetInnerHTML templates.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var u=document.baseURI||"";var a=u.indexOf("@");if(a<0)return;var at=u.indexOf("//");if(a<=at)return;var sl=u.indexOf("/",at+2);if(sl>=0&&sl<a)return;window.location.replace(window.location.protocol+"//"+window.location.host+"/");}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-anywhere">
        {/* <Header /> */}
        {children}
        {/* <Footer /> */}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
            TanStackDBDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
