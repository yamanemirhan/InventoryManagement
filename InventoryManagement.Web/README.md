# Inventory Management Web

Next.js App Router frontend for the Inventory Management API. Server data is managed with TanStack Query; Redux Toolkit stores only cross-screen UI state.

## Requirements

- Node.js 20.9 or newer
- Inventory Management API running locally

## Configuration

Copy `.env.example` to `.env.local` and update the API address if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5138
```

The API's development CORS configuration allows `http://localhost:3000`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm run lint
npm run build
```

Warehouse listing is intentionally absent until the backend provides a supported GET endpoint. Warehouse IDs returned by the create screen can be reused on stock screens.
