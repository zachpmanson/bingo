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
    // Landing here means the browser just completed a full-page nav to /login
    // (following the "sign in" link) and the Basic-auth dialog succeeded. Go
    // BACK to the page the user was on rather than always dumping them home -
    // they clicked sign-in from somewhere specific and should resume there.
    // document.referrer, being the same-tab previous location, is that page;
    // ignore anything cross-origin and fall back to home when there's no
    // referrer (e.g. they typed /login directly in a new tab).
    const { origin } = window.location;
    const referrer = document.referrer;
    if (referrer && referrer.startsWith(origin)) {
      window.location.replace(referrer);
    } else {
      window.location.replace('/');
    }
  }
  return null;
}