# What Can I Do On This Property?

Premium zoning/utilities/risks SaaS with glass landing + clean dashboard (Next.js + TS).

## Getting started

### Prereqs
- Node 18+
- pnpm | npm | yarn (scripts assume npm but any works)

### Install
```
npm install
```

### Dev
```
npm run dev
```
App will start on http://localhost:3000

### Build / start
```
npm run build
npm start
```

### Lint
```
npm run lint
```

### Env
Copy `env.example` to `.env.local` and set:
- `MAP_PROVIDER_TOKEN` – map provider token (placeholder; map currently mocked)

## Routes
Public:
- `/` landing (glass over house background image path `/images/house-bg.jpg`)
- `/pricing`
- `/how-it-works`
- `/faq`
- `/login`
- `/signup`

App (authenticated shell):
- `/app` → redirects to `/app/properties`
- `/app/properties`
- `/app/properties/new`
- `/app/properties/[id]` (dashboard: summary + map placeholder + AI panel)
- `/app/properties/[id]/zoning`
- `/app/properties/[id]/utilities`
- `/app/properties/[id]/environment`
- `/app/properties/[id]/hazards`
- `/app/properties/[id]/visualizer`
- `/app/properties/[id]/reports`
- `/app/assistant`
- `/app/settings`

## Notes
- UI follows `/docs/DESIGN_RULES.md` and `/docs/RESPONSIVE_RULES.md`.
- Landing page uses existing house background asset path `/images/house-bg.jpg` (not replaced).
- Map + AI are mocked; wire to your services and map token when ready.