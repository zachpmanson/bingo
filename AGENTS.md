# bingo — Agent Context

Online bingo game. GitHub: `zachpmanson/bingo`

## Overview

- **Status:** Active
- **Tech:** Node.js, TanStack Start (Vite), TanStack Router, tRPC, Nitro
- **Stack**: React 19, Tailwind v4, TanStack Query, React Confetti, tRPC vs 11
- **UI:** Shadcn components (`components.json`)

## Project Structure

| Path | Purpose |
|------|---------|
| `src/routes/` | file-based routes (Router-plugin generated `routeTree.gen.ts`) |
| `src/components/` | UI components (Shadcn + game-specific) |
| `src/server/` | TanStack Start server functions / tRPC router |
| `src/integrations/` | external integrations |
| `src/hooks/`, `src/lib/`, `src/db-collections/` | app logic + TanStack DB collections |

## Dev

Use the flake devshell: `nix develop` (provides `nodejs`, `pnpm`).

```bash
pnpm install       # deps (pnpm)
pnpm dev           # vite dev, port 3000
pnpm build         # production build (Nitro -> dist/)
pnpm preview       # preview production build
```

## Lint & Format

```bash
pnpm lint          # eslint
pnpm format        # prettier --write . && eslint --fix
pnpm check         # prettier --check .
pnpm test          # vitest
```

## Build & Deploy

- **Build:** `pnpm build`; Nix derivation (`nix/package.nix`) packages it.
- **Deploy:** `make deploy` → `ssh bingo` (deployed on naboo). Also deployable via `deploy-service bingo`; runs as a systemd service managed by the nix flake.

## Related

- Deployment / Nix infra: see `~/beltino/AGENTS.md` [[Deployment-Infrastructure]]