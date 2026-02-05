# Discord OAuth2 Guild Auth Monorepo

This monorepo provides a full-stack Discord OAuth2 login flow with guild membership checks and role-based permissions.

## Stack
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
- Frontend: Vite, React, TypeScript
- Sessions: `express-session` + `connect-pg-simple`

## Setup
1. Create a Discord application at the Discord Developer Portal.
2. Add an OAuth2 redirect URI:
   - `http://localhost:3000/auth/discord/callback`
3. Copy `.env.example` to `.env` and fill in the required values.
4. Create `frontend/.env` and set:
   - `VITE_API_URL=http://localhost:3000`
5. Start Postgres:
   - `npm run dev:db`
6. Install dependencies:
   - `npm install`
7. Run Prisma migrations:
   - `npm run prisma --workspace backend migrate dev`
8. Start both servers:
   - `npm run dev`

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

## OAuth2 Scopes
The app uses `identify` and `guilds.members.read` to verify server membership and roles.

## Role Mapping
Set role IDs in `.env`:
- `DISCORD_ROLE_ADMIN_ID`
- `DISCORD_ROLE_MOD_ID`
- `DISCORD_ROLE_PREMIUM_ID`

## Token Storage
Refresh tokens are encrypted at rest with AES-GCM when `APP_ENCRYPTION_KEY` is set (base64-encoded 32 bytes).

## Key Routes
- `GET /auth/discord/login`
- `GET /auth/discord/callback`
- `POST /auth/logout`
- `GET /me`
- `POST /me/refresh`
- `GET /admin/ping` (requires `admin`)
- `GET /mod/ping` (requires `mod`)
