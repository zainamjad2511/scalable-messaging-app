# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (Sprint 3 - Frontend)
- Next.js 14 Frontend initialized in `apps/web`.
- Implemented Discord & Linear hybrid UI aesthetic within `app/globals.css`.
- Landing/Login page (`app/page.tsx`) with localStorage session routing.
- Real-time hooks (`useWebSocket.ts`) connecting to ws://localhost:4000.
- Discord-style mock multi-column layout for chat interface (`app/chat/page.tsx`).
- Real-time message dispatching with optimistic UI updating.
- Integration dependencies for `@repo/shared` and `@repo/types` mapped inside the React app.
- Backend WebSocket server with `express` and `ws` (`apps/api`).
- Active WebSocket connection manager for routing and broadcasting.
- Supabase integration with RPC calls for `insert_message` and `get_or_create_user`.
- API endpoints `GET /health` and `GET /api/messages` for loading message history.
- Root `package.json` with npm workspaces configuration.
- Root `tsconfig.base.json` for shared TypeScript configuration.
- `@repo/types` package with WebSocket events and payload definitions.
- `@repo/shared` package with runtime utilities (`sanitizeUsername`, `isValidUsername`, `truncateContent`).
- Basic `.gitignore` configurations for node modules and keeping documentation.
- Initial project structure with `apps/api` and `apps/web` (placeholders).
