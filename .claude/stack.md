# Stack

Lahore Air Intelligence — air-quality dashboard (frontend) for the City
Intelligence project. It reads live data from the FastAPI backend in
`../backend`, which serves open city data from Open-Meteo, OpenWeatherMap and
WAQI. There is no sample data left in the build.

## Language & runtime

- TypeScript 5, strict mode
- Node 24, npm 11
- Next.js 16.3.5 (App Router, Turbopack, React Compiler enabled)
- React 19.2

## Commands

| Token | Command | Notes |
| --- | --- | --- |
| `<install>` | `npm install` | |
| `<dev>` | `npm run dev` | http://localhost:3000 |
| `<build>` | `npm run build` | Also runs the TypeScript check |
| `<typecheck>` | `npx tsc --noEmit` | |
| `<test>` | `npm test` | Vitest, jsdom, colocated `*.test.ts(x)` |
| `<test:one>` | `npx vitest run <path>` | Path or directory |
| `<lint>` | `npm run lint` | `eslint` via `eslint-config-next` |
| `<format>` | n/a | No formatter configured; ESLint only |
| `<migrate>` | n/a | No database |

The backend must be running (`uvicorn app.main:app --port 8000` in
`../backend`) and its `CORS_ORIGINS` must list this page's origin, or every
request is blocked by the browser before it reaches the network.

## Environment

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000` | Read once in `lib/config.ts`, never elsewhere |

`NEXT_PUBLIC_` is correct here: the browser has to know the URL, and it is not
a secret. Nothing else in this app reads an environment variable.

## Styling

- Tailwind CSS v4 — configured in CSS (`app/globals.css`), **no `tailwind.config.ts`**
- shadcn/ui, `radix-nova` preset, Radix primitives, `neutral` base, CSS variables
- `cn` comes from `@/lib/utils`, which re-exports the `cn` package
- Icons: `lucide-react`

## Boundaries

```
app/           routes and layouts — routing and shell only
components/    presentation; ui/ is generated shadcn output, do not hand-edit
lib/           domain logic and data access, framework-free where possible
```

- Client components read data through `lib/aqi/api.ts` only. It owns the single
  axios client, the base URL, the timeout and the error mapping; nothing else in
  the app calls `fetch` or `axios`.
- `lib/aqi/*` (types, severity, quality, trend, best-time, alerts,
  recommendations, insights, correlation, scenarios) are pure domain modules —
  no Next, no fetch, no React.
- `components/map/AreasMap.tsx` is Leaflet and DOM-only — reach it via
  `AreasMapPanel`, which loads it with `ssr: false`.
- No file reads `process.env`.

## Single sources of truth

- Data shapes: `lib/aqi/types.ts` is the single wire contract, mirroring
  `../backend/app/models/schemas.py` field for field. The backend serialises
  camelCase via a `to_camel` alias generator, so no mapping layer sits between
  them — change one and you must change the other.
- AQI bands, labels, advice and colours: `lib/aqi/severity.ts` + the `--aqi-*`
  tokens in `app/globals.css`. Nothing else names a severity colour.
- Thresholds and rules: `lib/aqi/alerts.ts`, `lib/aqi/trend.ts`,
  `lib/aqi/best-time.ts` — each threshold lives next to the label it drives.
- Date and number formatting: `lib/format.ts` (fixed locale and timezone, so
  server and client renders match).

## Honesty rules

- Never overstate what the data is. Readings are live but published hourly by
  the providers and cached 5–30 minutes by the backend, so "live, updated
  hourly" is accurate and "real-time" is not.
- Never present the forecast as measured. Every chart, list and readout keeps
  observed and predicted apart, and `forecastInsights` never claims causation.
- The neighbourhood `areas` are still labelled as *model grid points*, not
  physical stations, because a real backend would deliver them that way.

## Known state

- All five backend endpoints are wired: `/current`, `/history`, `/forecast`,
  `/forecast/accuracy`, `/areas`, `/stations`. `lib/aqi/demo-data.ts` has been
  deleted.
- The six neighbourhood points can return identical readings. Open-Meteo's
  global air-quality grid is roughly 0.4° (~40 km) and Lahore spans about
  30 km, so all six coordinates can land in one cell. The backend issues six
  separate requests; the resolution is upstream. See
  `../backend/ARCHITECTURE.md` → Known limitations.
- `/stations` returns an empty list: WAQI reports no active station in Lahore.
  That is a valid answer, not an error, and it is why `/areas` reads a model.
- Vitest runs under `TZ=America/New_York` (set in `vitest.setup.ts`) so anything
  formatting against the machine's local zone instead of `DISPLAY_TIME_ZONE` fails.
- `AqiTrendChart` and `AreasMap` are untested: Recharts needs real layout
  measurement and Leaflet a real canvas, so in jsdom both render empty and a
  passing test there would assert nothing.
- `server-only` is aliased to `test/server-only.stub.ts` in `vitest.config.mts`;
  the package is now only carried in `package.json` for that alias and has no
  importer.