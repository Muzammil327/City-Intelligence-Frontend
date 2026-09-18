# Stack

Lahore Air Intelligence — air-quality dashboard (frontend) for the City
Intelligence project. **Frontend-only by explicit scope**: the UI runs entirely
on bundled sample (dummy) data — no backend, no network, no environment
variables.

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

No backend or environment variables are required. `npm run dev` and everything
else works standalone; the app runs offline for the demo.

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

- Client components read data through `lib/aqi/api.ts` only. It serves bundled
  demo data from `lib/aqi/demo-data.ts` with a small simulated latency; wiring a
  real backend later means swapping the bodies of the four `fetch*` functions.
- `lib/aqi/*` (types, severity, quality, trend, best-time, alerts,
  recommendations, insights, correlation) are pure domain modules — no Next, no
  fetch, no React. `demo-data.ts` is also pure TS.
- `components/map/AreasMap.tsx` is Leaflet and DOM-only — reach it via
  `AreasMapPanel`, which loads it with `ssr: false`.
- No file reads `process.env`.

## Single sources of truth

- Data shapes: `lib/aqi/types.ts` is the single wire contract; `lib/aqi/demo-data.ts`
  supplies sample values in exactly those shapes. Do not invent a field in one
  without the other.
- AQI bands, labels, advice and colours: `lib/aqi/severity.ts` + the `--aqi-*`
  tokens in `app/globals.css`. Nothing else names a severity colour.
- Thresholds and rules: `lib/aqi/alerts.ts`, `lib/aqi/trend.ts`,
  `lib/aqi/best-time.ts` — each threshold lives next to the label it drives.
- Date and number formatting: `lib/format.ts` (fixed locale and timezone, so
  server and client renders match).

## Honesty rules

- All numbers are **sample values**, and the page header says so. Never present
  the demo data as live readings in copy, tests or labels.
- Never present the forecast as measured. Every chart, list and readout keeps
  observed and predicted apart, and `forecastInsights` never claims causation.
- The neighbourhood `areas` are still labelled as *model grid points*, not
  physical stations, because a real backend would deliver them that way.

## Known state

- This build is frontend-only; all "data" comes from `lib/aqi/demo-data.ts`
  (deterministic, consistent: PM2.5 69.4 → AQI ≈ 158, history/forecast/areas all
  sit in the same "unhealthy" band).
- The previous mock pieces (`mock-data.ts`, `app/api/*`, a `backend-client.ts`)
  are gone; the Next-only seam is `lib/aqi/api.ts`, which layers a 180 ms
  simulated delay over the demo data.
- Vitest runs under `TZ=America/New_York` (set in `vitest.setup.ts`) so anything
  formatting against the machine's local zone instead of `DISPLAY_TIME_ZONE` fails.
- `AqiTrendChart` and `AreasMap` are untested: Recharts needs real layout
  measurement and Leaflet a real canvas, so in jsdom both render empty and a
  passing test there would assert nothing.
- `server-only` is aliased to `test/server-only.stub.ts` in `vitest.config.mts`;
  the package is now only carried in `package.json` for that alias and has no
  importer.