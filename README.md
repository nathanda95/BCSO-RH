# Discord OAuth2 Guild Auth Monorepo

This monorepo provides a full-stack Discord OAuth2 login flow with guild membership checks and role-based permissions.
It also includes the BCSO RH cadet tracking MVP (cadets, recruitment, training modules, evaluations, audit logs).

## Stack
- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
- Frontend: Vite, React, TypeScript
- Sessions: `express-session` + `connect-pg-simple`

## Local Setup
1. Create a Discord application at the Discord Developer Portal.
2. Add an OAuth2 redirect URI:
   - `http://localhost:3000/auth/discord/callback`
3. Backend environment:
   - Copy `.env.example` to `backend/.env` and fill the required values.
4. Frontend environment:
   - Create `frontend/.env` and set:
   - `VITE_API_URL=http://localhost:3000`
5. Start Postgres (Docker):
   - `npm run dev:db`
6. Install dependencies (monorepo):
   - `npm install`
7. Generate Prisma client:
   - `npm run generate --workspace backend`
8. Run Prisma migrations:
   - `npm run migrate --workspace backend`
9. Start both servers:
   - `npm run dev`

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

## OAuth2 Scopes
The app uses `identify` and `guilds.members.read` to verify server membership and roles.

## Role Mapping
Set role IDs in `.env`:
- `DISCORD_ROLE_ADMIN_ID`
- `DISCORD_ROLE_MOD_ID`
- `DISCORD_ROLE_PREMIUM_ID`
- `DISCORD_ROLE_CADET_ID` (optional)

## Token Storage
Refresh tokens are encrypted at rest with AES-GCM when `APP_ENCRYPTION_KEY` is set (base64-encoded 32 bytes).

## Cadet Tracking MVP
Features:
- Cadet profiles with recruitment sections, training modules, evaluation, and audit logs.
- Training modules are defined by admins/mods and applied to all cadets.
- Cadet self-view (`/cadets/me`) mapped by `User.username` (strict match).
- Signature + lock behavior: mod cannot edit signed sections, admin can edit but audit is logged.

### Training Modules
- Create/edit/delete module definitions at `/training`.
- When a module is created, it is automatically added to all cadets.

### Data Model Highlights
- `Cadet.user_id` links to `User` (optional, unique).
- `TrainingModuleDefinition` + per-cadet `TrainingModule` entries.
- `AuditLog` for create/update/sign/delete actions.

## Key Routes
- `GET /auth/discord/login`
- `GET /auth/discord/callback`
- `POST /auth/logout`
- `GET /me`
- `POST /me/refresh`
- `GET /admin/ping` (requires `admin`)
- `GET /mod/ping` (requires `mod`)
- `GET /cadets` (mod/admin)
- `POST /cadets` (mod/admin)
- `GET /cadets/:id` (mod/admin)
- `PATCH /cadets/:id` (mod/admin)
- `DELETE /cadets/:id` (admin)
- `GET /cadets/me` (cadet/mod/admin)
- `PATCH /cadets/:id/recruitment/*` (mod/admin)
- `PATCH /cadets/:id/training/modules/:moduleId` (mod/admin)
- `PATCH /cadets/:id/evaluation` (mod/admin)
- `POST /cadets/:id/sign` (mod/admin)
- `GET /cadets/:id/audit` (mod/admin)
- `GET /training/modules` (mod/admin)
- `POST /training/modules` (mod/admin)
- `PUT /training/modules/:id` (mod/admin)
- `DELETE /training/modules/:id` (mod/admin)
