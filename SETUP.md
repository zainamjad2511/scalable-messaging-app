# Setting Up & Running the Application

This guide contains the exact steps your teammates will need to run the application locally on their machines after pulling from GitHub.

## 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (Comes with Node)
- **Git**

## 2. Environment Variables
Your teammates will need to setup their own `.env` files locally since these are safely ignored by git.

### Backend (`apps/api/.env`)
Copy `apps/api/.env.example` to `apps/api/.env` and set your Supabase values (and Redis if you use it):
```env
PORT=4000
NODE_ID="node-1"
SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
SUPABASE_SERVICE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
# REDIS_URL — see .env.example for host vs Docker Compose
```

### Frontend (`apps/web/.env.local`)
The WebSocket URL must match **how the browser reaches the API**. Copy `apps/web/.env.example` as a template.

| How you run the API | `NEXT_PUBLIC_WS_URL` | Notes |
|---------------------|----------------------|--------|
| **Docker Compose + Nginx** (`docker compose up` — Nginx on host port **80**) | `ws://localhost` | Same as the app default; you can omit `.env.local`. Next.js still runs on **http://localhost:3000**; only the WS client connects to port 80. |
| **Direct API on your machine** (`npm run dev:api`, default **4000**) | `ws://localhost:4000` | Required — the default port 80 URL would not reach the API. |

Example for direct API only:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## 3. Database Replication (Supabase)
If someone is setting up a totally fresh Supabase project, they must run the initialization schema.
1. Open your Supabase Dashboard SQL Editor.
2. Copy the entire contents of `infra/supabase/schema.sql` and hit **Run**.
*(This builds the Users table, Messages table, Direct Messaging relations, and RPC functions dynamically).*

## 4. Install Dependencies
Because this is an NPM Monorepo, **you must run install from the root folder!**
Navigate into the root of the project (`scalable-messaging-app`) and run:
```bash
npm install
```
This automatically wires up `@repo/shared` and `@repo/types` to both your frontend and backend.

## 5. Booting the Servers

You will need to run the Frontend and the Backend in **two separate terminal windows**. Ensure you are in the project ROOT folder for both.

### Terminal 1 (The Backend):
```bash
npm run dev:api
```

### Terminal 2 (The Frontend):
```bash
npm run dev --workspace=apps/web
```
*(The frontend will automatically be available locally at `http://localhost:3000`)*

### Optional: full stack with Nginx + Redis + API replicas
From the repo root (with `apps/api/.env` configured and Supabase schema applied):
```bash
docker compose up --build
```
Use `NEXT_PUBLIC_WS_URL=ws://localhost` (or rely on the frontend default) so the browser’s WebSocket hits Nginx on port 80.

---
