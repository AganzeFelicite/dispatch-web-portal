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

## Business portal and customer accounts

`/portal` is the self-service dashboard for business customers (phone + OTP sign-in, the same as
the customer app): spend, trips, per-day and per-vehicle breakdowns, recent trips, CSV statement.
Ops see the identical dashboard for any account at `/customers/{id}`. Both render
`components/CustomerDashboard.tsx`; the charts are plain SVG in `components/Columns.tsx`.
The portal shares the bearer slot with the console, so one browser holds one identity at a time.
Businesses can also book from the portal (`/portal/book`); the form is `components/BookingForm.tsx`,
shared with the ops New booking page.

## Place search (booking form)

The map picker's search box is live typeahead, the same as the mobile app: suggestions appear as
you type, each with the place name and its street/area, biased to Kigali and limited to Rwanda.
`lib/places.ts` mirrors `mobile/lib/core/geo.dart`:

- `NEXT_PUBLIC_GOOGLE_PLACES_KEY` set → Google Places API (New) autocomplete (shops, buildings,
  gates); coordinates are fetched only for the chosen suggestion, one billing session per pick.
  Restrict the key to the console's origin, it ships to the browser.
- Blank → free OpenStreetMap search (komoot Photon). Fine for dev and low volume.

Enter picks the first suggestion, Escape closes the list, clicking the map still drops a pin.
Reverse geocoding of a map click uses Mapbox (`NEXT_PUBLIC_MAPBOX_TOKEN`).

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
