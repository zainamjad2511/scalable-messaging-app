# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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
