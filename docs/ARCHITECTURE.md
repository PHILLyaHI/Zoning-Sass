# Architecture — Zoning Intelligence Platform

## High-Level Architecture Diagram (Text Form)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌─────────────┐ │
│   │   Next.js    │   │   MapLibre   │   │   Canvas     │   │   WebSocket │ │
│   │   App Router │   │   GL / Deck  │   │   Editor     │   │   Client    │ │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬──────┘ │
│          │                  │                  │                  │         │
│          └──────────────────┴──────────────────┴──────────────────┘         │
│                                    │                                        │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│   Auth (Clerk/Auth0)  │  Rate Limiting  │  Request Validation  │  Caching  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
┌───────────────────────┐ ┌──────────────────┐ ┌────────────────────────────┐
│   PROPERTY SERVICE    │ │  GEOMETRY SERVICE │ │   RULE ENGINE (CORE)      │
├───────────────────────┤ ├──────────────────┤ ├────────────────────────────┤
│ • Address geocoding   │ │ • Parcel import   │ │ • Deterministic checks    │
│ • APN lookup          │ │ • Setback calc    │ │ • Zoning validation       │
│ • Parcel retrieval    │ │ • Buildable area  │ │ • Wastewater rules        │
│ • Property record CRUD│ │ • Structure place │ │ • Height/coverage/FAR     │
│                       │ │ • Collision detect│ │ • Citation binding        │
└───────────┬───────────┘ └────────┬─────────┘ └─────────────┬──────────────┘
            │                      │                         │
            │                      │                         │
            ▼                      ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐│
│   │  PostgreSQL │   │   PostGIS   │   │    Redis    │   │   Vector Store  ││
│   │  (Core DB)  │   │  (Geometry) │   │   (Cache)   │   │  (Embeddings)   ││
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL DATA SOURCES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐│
│   │   Regrid    │   │   USDA/NRCS │   │    FEMA     │   │   County APIs   ││
│   │  (Parcels)  │   │   (Soils)   │   │  (Flood)    │   │  (Zoning/Permits││
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────────┘│
│                                                                             │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐│
│   │  NWI/USFWS  │   │   State DEQ │   │   Utility   │   │   Ordinance     ││
│   │ (Wetlands)  │   │  (Septic)   │   │  Districts  │   │   Documents     ││
│   └─────────────┘   └─────────────┘   └─────────────┘   └─────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI LAYER (EXPLANATION ONLY)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                      OpenAI Integration                              │  │
│   ├─────────────────────────────────────────────────────────────────────┤  │
│   │  ALLOWED:                          │  NOT ALLOWED:                   │  │
│   │  • Explain rule check results      │  • Guess zoning districts       │  │
│   │  • Parse ordinance → JSON rules    │  • Invent rules or citations    │  │
│   │  • Answer with provided context    │  • Make factual claims          │  │
│   │  • Suggest placement in buildable  │  • Override deterministic checks│  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow — Property Search to Validation

```
User enters address
        │
        ▼
┌───────────────────┐
│  Geocode Address  │ ──► External: Google/Mapbox/Census
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Fetch Parcel     │ ──► External: Regrid / County API
│  - geometry       │
│  - APN            │
│  - legal desc     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Spatial Queries  │ ──► PostGIS
│  - zoning overlay │
│  - sewer service  │
│  - wetlands       │
│  - flood zones    │
│  - soil types     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Load Rules       │ ──► PostgreSQL
│  for jurisdiction │
│  + zoning district│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Compute Derived  │ ──► Geometry Service
│  - setback lines  │
│  - buildable area │
│  - restricted zones│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Return to Client │
│  - parcel + layers│
│  - computed areas │
│  - initial checks │
│  - data gaps      │
└───────────────────┘
```

## Data Flow — Structure Placement Validation

```
User places/moves structure
        │
        ▼
┌───────────────────┐
│  Client Sends     │
│  - structure_type │
│  - footprint_geom │
│  - height         │
│  - use_type       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Rule Engine      │ (Deterministic - No AI)
├───────────────────┤
│  1. Setback check │ ──► Is footprint inside setback lines?
│  2. Height check  │ ──► Does height exceed limit?
│  3. Coverage check│ ──► Total footprint / lot area ≤ max?
│  4. FAR check     │ ──► Total floor area / lot area ≤ max?
│  5. Use check     │ ──► Is use permitted in zone?
│  6. Wastewater    │ ──► Distance to drainfield?
│  7. Wetland buffer│ ──► Distance to wetlands?
└─────────┬─────────┘
          │
          ▼
┌───────────────────────────────────────────────────┐
│  Validation Result                                 │
├───────────────────────────────────────────────────┤
│  {                                                 │
│    status: "pass" | "warn" | "fail",              │
│    checks: [                                       │
│      {                                             │
│        rule_id: "setback_front",                  │
│        status: "pass",                            │
│        measured_value: 25,                        │
│        required_value: 20,                        │
│        unit: "feet",                              │
│        citations: ["Ord 12.04.030(A)"]            │
│      },                                            │
│      ...                                           │
│    ],                                              │
│    data_gaps: ["rear_setback_unknown"]            │
│  }                                                 │
└─────────┬─────────────────────────────────────────┘
          │
          ▼
┌───────────────────┐
│  Optional: AI     │ ──► Explain results in plain English
│  Explanation      │     (uses ONLY validation result)
└───────────────────┘
```

## Key Principles

### 1. Deterministic First
- All factual outputs come from data: parcels, zoning polygons, ordinance rules
- Rule engine is pure functions with no AI involvement
- Every check produces measured vs required values

### 2. Citation Everything
- Every rule links to ordinance section
- Every data layer tracks source, date, jurisdiction
- Every answer shows "why" with references

### 3. Surface Uncertainty
- Missing data → WARN status (never PASS)
- Unknown values shown explicitly
- Data gaps listed in response
- "Verification needed" prompts

### 4. AI as Explainer Only
- OpenAI receives structured results, not raw questions
- AI cannot add facts, only explain provided facts
- AI cannot override deterministic checks
- All AI responses cite the data they explain

### 5. Jurisdiction-Aware
- Rules are per-jurisdiction, per-zone
- No hardcoded assumptions
- Graceful degradation when rules missing



