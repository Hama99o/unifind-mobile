# unifind-mobile

React Native (Expo SDK 54) port of the unifind web app. **Gluestack UI + NativeWind**, expo-router, two backends (Strapi catalog + Node user-data), Auth0, **en + ar (RTL)**.

> Architecture, rules and the migration plan live in [`CLAUDE.md`](CLAUDE.md) and [`docs/`](docs/). Workspace overview: [`../CLAUDE.md`](../CLAUDE.md).

## Run (Docker — port 3010)

```bash
cp .env.example .env          # set HOST_IP for phone testing; backends default to staging

# Web (Chrome, offline-friendly)
docker compose up web         # → http://localhost:3010

# Expo Go on a phone (same WiFi)
HOST_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K[\d.]+') docker compose up mobile
# → scan the QR with Expo Go
```

Port **3010** is dedicated to this app (3000 unifind-api · 3007/3008/3098 Hatiwal · 3009/3099/8081 edu are taken).

## Bottom tabs

Home · Program Explorer · Growth Center · Profile (`app/(main)/(tabs)/`). Each tab's screen lives in `src/screens/`; in-screen tabs/segments are added per feature.

## UI components

Gluestack UI v2. The base layer in `src/components/ui/` is scaffolded (NativeWind wrappers). Add official components as features need them:

```bash
npx gluestack-ui@latest add button input select checkbox actionsheet ...
```
Track conversions in [`docs/GLUESTACK_MIGRATION_CHECKLIST.md`](docs/GLUESTACK_MIGRATION_CHECKLIST.md).

## Build features

Manually: `/migrate-feature <slug>` from the workspace root. Autonomously: `/software-house` (board-driven multi-agent factory). Backlog + scope: [`docs/MIGRATION_QUEUE.md`](docs/MIGRATION_QUEUE.md); live board: [`docs/SPRINT_BOARD.md`](docs/SPRINT_BOARD.md).
