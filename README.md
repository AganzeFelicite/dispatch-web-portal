# Dispatch Console (web frontend)

The Phase 0 operations console — the web app the dispatcher runs the day from. Built with **Next.js
15 (App Router) + TypeScript + Tailwind v4 + TanStack Query**, talking to the Dispatch backend over
its REST API.

## Layout

```
console/
├── app/
│   ├── layout.tsx            root layout: brand fonts + React Query provider
│   ├── providers.tsx         TanStack Query client
│   ├── globals.css           Tailwind v4 + Dispatch brand tokens (navy/royal/blue/gold)
│   ├── page.tsx              entry redirect (board when signed in, else login)
│   ├── login/page.tsx        email + password → stores JWT
│   └── (app)/                authenticated area (guarded by a token check)
│       ├── layout.tsx        sidebar shell + sign out
│       ├── bookings/page.tsx WORKED PAGE — today board from GET /bookings
│       ├── customers/page.tsx WORKED PAGE — list from GET /customers
│       ├── drivers/page.tsx  placeholder (pattern to copy)
│       └── rate-cards/page.tsx placeholder
└── lib/
    ├── api.ts                fetch wrapper: attaches bearer, unwraps ApiResponse, throws ApiError
    ├── auth.ts               JWT + staff in localStorage
    └── types.ts              TypeScript mirrors of the backend DTOs
```

## The pattern

`bookings/page.tsx` is the template for every list screen: a `useQuery` calling `apiFetch` (which
unwraps the `{ success, data }` envelope and attaches the bearer token), rendering the paginated
`{ items, meta }` shape. `login/page.tsx` shows the write path. Copy these to build drivers, rate
cards, and the booking detail/assign/status actions against the endpoints in
`../backend` / `docs/engineering/Dispatch_API_Spec.md`.

Auth is intentionally simple for an internal tool: the JWT lives in `localStorage` and is sent as a
bearer; a 401 clears it and drops back to the login screen. (There is no SSR-side guard — add
middleware + httpOnly cookies if the console is ever exposed beyond the ops team.)

## Running

```bash
cp .env.example .env.local     # point NEXT_PUBLIC_API_BASE at the backend
npm install
npm run dev                    # http://localhost:3000
```

The backend must be running (default `http://localhost:8080/api`) and CORS must allow the console
origin. Sign in with the seeded admin (`admin@dispatch.rw` / `admin1234` by default) — change that
in the backend for any real environment.
