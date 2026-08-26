import { createFileRoute } from '@tanstack/react-router';

// /login is edge-gated by Caddy for HTTP Basic auth — unlike the rest of bingo
// (which stays anonymous), the browser must be able to reach this from a
// signed-OUT state from an app it can then show the native credential prompt.
// Reaching this page means the request got through Caddy (i.e. we now have
// valid credentials), so we immediately send the user home. The "sign in"
// button in the header is a plain <a> to /login (full page nav, NOT a
// client-side Link) precisely so the browser's Basic-auth dialog appears on
// the 401.
export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Sign in - Bingo' }],
  }),
  component: LoginRoute,
});

function LoginRoute() {
  if (typeof window !== 'undefined') {
    window.location.replace('/');
  }
  return null;
}