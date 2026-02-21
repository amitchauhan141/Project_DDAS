# DDAS - Data Download & Access System

DDAS supports:
- Browser-level duplicate detection with user decision popup
- Multi-user USID authentication
- Role-based access control (Admin / Researcher / Viewer)
- Secure session logging

## Authentication Model

Login endpoint now requires:
- `usid`
- `password`

Roles:
- `ADMIN`
- `RESEARCHER`
- `VIEWER`

Every login creates a session log; every logout closes session state.
JWT includes session id (`sid`) and backend validates active session on each request.

## Browser Duplicate Detection Flow

1. Browser extension intercepts new download.
2. Extension calls `POST /api/datasets/duplicate-check/browser-download` with metadata.
3. Backend computes metadata fingerprint hash and checks central repository.
4. If duplicate:
- Show popup with file name, existing location, user, timestamp
- Actions: Open Existing, Cancel, Download Anyway
5. Chosen action is logged through `POST /api/datasets/duplicate-decision`.
6. If user continues, completed download is ingested into DDAS via `POST /api/datasets/ingest/browser-download`.

## Core APIs

Base URL: `http://localhost:4000/api`

### Auth
- `POST /auth/login` `{ "usid": "RSH001", "password": "Password123!" }`
- `POST /auth/logout`

### Dataset
- `POST /datasets/upload` (Admin/Researcher)
- `POST /datasets/duplicate-check/browser-download`
- `POST /datasets/duplicate-decision`
- `POST /datasets/ingest/browser-download`
- `GET /datasets`
- `GET /datasets/:id`
- `PATCH /datasets/:id/rename` (Admin/Researcher)
- `DELETE /datasets/:id` (Admin/Researcher)
- `POST /datasets/:id/download`

### Sharing
- `POST /sharing/user` (Admin/Researcher)
- `POST /sharing/department` (Admin/Researcher)
- `GET /sharing/with-me`
- `GET /sharing/by-me`
- `GET /departments`

### Access Requests
- `POST /access-requests`
- `GET /access-requests`
- `POST /access-requests/:id/approve` (Admin/Researcher)
- `POST /access-requests/:id/reject` (Admin/Researcher)

### Search
- `GET /search?query=...`

## Run Backend

```bash
cd /Users/amitkumarchauhan/Documents/New\ project/backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

`.env`:
```env
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/ddas?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=8h
```

## Demo Users (after seed)

- `ADM001` / `Password123!` (Admin)
- `RSH001` / `Password123!` (Researcher)
- `VIW001` / `Password123!` (Viewer)

## Run Frontend

```bash
cd /Users/amitkumarchauhan/Documents/New\ project/frontend
npm install
npm run dev
```

Optional frontend `.env`:
```env
VITE_API_URL=http://localhost:4000/api
```

## Extension Setup

See `/Users/amitkumarchauhan/Documents/New project/browser-extension/README.md`
