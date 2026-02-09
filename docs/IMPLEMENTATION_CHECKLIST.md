# Implementation Checklist — Zoning Intelligence Platform

## Overview

This document outlines the phased implementation plan for building the production-grade zoning intelligence platform.

---

## Phase 0: Foundation (Week 1-2)

### Infrastructure

- [ ] Set up monorepo structure (Turborepo or Nx)
- [ ] Configure Next.js 14+ with App Router
- [ ] Set up TypeScript with strict mode
- [ ] Configure ESLint + Prettier
- [ ] Set up Tailwind CSS with design tokens
- [ ] Configure PostGIS-enabled PostgreSQL (Neon, Supabase, or AWS RDS)
- [ ] Set up Redis for caching (Upstash or AWS ElastiCache)
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Set up staging and production environments
- [ ] Configure error monitoring (Sentry)
- [ ] Set up logging (Axiom or similar)

### Auth & User Management

- [ ] Integrate auth provider (Clerk or Auth0)
- [ ] Set up user table and profiles
- [ ] Implement subscription tiers (Stripe integration)
- [ ] Create protected route middleware
- [ ] Implement API key management for future API access

### Database Setup

- [ ] Create core schema (jurisdictions, zoning_districts, zoning_polygons)
- [ ] Create user schema (users, properties, projects)
- [ ] Set up PostGIS extensions
- [ ] Create spatial indexes
- [ ] Set up database migrations (Drizzle or Prisma)
- [ ] Seed initial jurisdiction data

---

## Phase 1A: Core Data Infrastructure (Week 3-4)

### External Data Integrations

- [ ] Integrate geocoding service (Google/Mapbox/Census)
- [ ] Integrate parcel data provider (Regrid API)
- [ ] Set up parcel caching layer
- [ ] Create parcel fetching service
- [ ] Implement rate limiting for external APIs
- [ ] Set up webhook handlers for data updates

### Zoning Data Pipeline

- [ ] Create zoning polygon import service
- [ ] Build jurisdiction boundary importer
- [ ] Implement zoning district mapper
- [ ] Create data validation layer
- [ ] Set up data refresh schedules
- [ ] Build admin interface for data management

### Map Infrastructure

- [ ] Set up MapLibre GL JS
- [ ] Create map component with standard controls
- [ ] Implement layer toggle system
- [ ] Build parcel highlight functionality
- [ ] Create popup/tooltip components
- [ ] Implement responsive map behavior

---

## Phase 1B: Property Dashboard (Week 5-6)

### Address Search

- [ ] Build address search component
- [ ] Implement autocomplete with geocoding
- [ ] Create APN search option
- [ ] Build map pin drop functionality
- [ ] Implement search history
- [ ] Create "recent properties" list

### Property Record Management

- [ ] Create property save/unsave functionality
- [ ] Build property list view
- [ ] Implement property CRUD operations
- [ ] Create property sharing (future)
- [ ] Build property refresh mechanism
- [ ] Implement last-updated tracking

### Dashboard Layout

- [ ] Build responsive dashboard shell
- [ ] Create map + inspector panel layout
- [ ] Implement mobile bottom sheet
- [ ] Build layer control panel
- [ ] Create feasibility snapshot component
- [ ] Implement property details card

### Spatial Queries

- [ ] Build zoning district lookup (point-in-polygon)
- [ ] Implement multi-layer intersection queries
- [ ] Create jurisdiction detection
- [ ] Build overlay zone detection
- [ ] Implement distance calculations
- [ ] Create spatial caching layer

---

## Phase 1C: Rule Engine v1 (Week 7-8)

### Rule Schema

- [ ] Define rule type enum
- [ ] Create rule table schema
- [ ] Build rule loading service
- [ ] Implement condition expression evaluator
- [ ] Create rule priority system
- [ ] Build rule versioning

### Core Validation Checks

- [ ] Implement front setback check
- [ ] Implement side setback check
- [ ] Implement rear setback check
- [ ] Implement street-side setback check
- [ ] Implement max height check
- [ ] Implement lot coverage check
- [ ] Implement FAR check
- [ ] Implement lot size minimum check

### Validation Service

- [ ] Create validation orchestrator
- [ ] Build check result aggregator
- [ ] Implement status determination (pass/warn/fail)
- [ ] Create citation attachment
- [ ] Build data gap detector
- [ ] Implement validation caching

### Feasibility Snapshot

- [ ] Build feasibility component
- [ ] Create indicator display (green/yellow/red)
- [ ] Implement expandable explanations
- [ ] Link to source citations
- [ ] Show verification prompts
- [ ] Build "why" popovers

---

## Phase 1D: Geometry Engine (Week 9-10)

### Parcel Processing

- [ ] Build parcel import from GeoJSON
- [ ] Create parcel simplification (if needed)
- [ ] Implement parcel metrics calculation (area, dimensions)
- [ ] Build front/side/rear edge detection
- [ ] Create parcel orientation detection
- [ ] Implement lot width/depth calculation

### Setback Line Generation

- [ ] Build inward buffer for setbacks
- [ ] Create per-edge setback lines
- [ ] Handle corner lot logic
- [ ] Generate setback polygons
- [ ] Handle irregular parcels
- [ ] Create setback visualization

### Buildable Area Computation

- [ ] Subtract all setbacks from parcel
- [ ] Subtract restricted areas
- [ ] Generate buildable polygon
- [ ] Handle multi-part buildable areas
- [ ] Create buildable area visualization
- [ ] Store computed geometries

---

## Phase 1E: Structure Placement (Week 11-12)

### Structure Editor

- [ ] Build structure palette (house, ADU, garage, etc.)
- [ ] Create drag-and-drop placement
- [ ] Implement structure resize handles
- [ ] Build rotation controls
- [ ] Create structure properties panel
- [ ] Implement structure deletion

### Real-time Validation

- [ ] Hook validation to structure movement
- [ ] Implement debounced validation calls
- [ ] Create visual feedback system
- [ ] Build collision detection (structure-to-structure)
- [ ] Implement distance measurement display
- [ ] Create validation tooltip on hover

### Project Management

- [ ] Build project save/load
- [ ] Implement undo/redo
- [ ] Create project duplication
- [ ] Build project comparison (future)
- [ ] Implement auto-save
- [ ] Create project export

---

## Phase 1F: AI Integration (Week 13-14)

### OpenAI Setup

- [ ] Configure OpenAI API client
- [ ] Set up prompt management system
- [ ] Implement response caching
- [ ] Create token usage tracking
- [ ] Build rate limiting
- [ ] Implement fallback handling

### Explanation Service

- [ ] Build validation result explainer
- [ ] Create structured response formatter
- [ ] Implement citation injection
- [ ] Build plain-English translator
- [ ] Create next-steps generator
- [ ] Implement explanation caching

### Q&A Assistant

- [ ] Build chat interface component
- [ ] Create context injection (property + rules)
- [ ] Implement suggested questions
- [ ] Build conversation history
- [ ] Create answer formatting
- [ ] Implement source citation display

### Placement Recommendations

- [ ] Build buildable area analyzer
- [ ] Create optimal placement suggester
- [ ] Implement constraint explainer
- [ ] Build recommendation display
- [ ] Create "apply suggestion" action

---

## Phase 2A: Wastewater Data (Week 15-16)

### Data Sources

- [ ] Integrate sewer service area datasets
- [ ] Import water service area datasets
- [ ] Integrate USDA SSURGO soil data
- [ ] Set up soil data caching
- [ ] Create service area lookup
- [ ] Build data refresh pipeline

### Database Extensions

- [ ] Create sewer_service_areas table
- [ ] Create water_service_areas table
- [ ] Create soil_units table
- [ ] Create septic_rules table
- [ ] Add spatial indexes
- [ ] Create wastewater lookup functions

### Spatial Integration

- [ ] Build sewer service area query
- [ ] Implement soil type intersection
- [ ] Create distance-to-sewer calculation
- [ ] Build soil limitation aggregator
- [ ] Implement depth-to-water lookup
- [ ] Create perc rate estimation

---

## Phase 2B: Wastewater Rule Engine (Week 17-18)

### Sewer Rules

- [ ] Implement sewer availability check
- [ ] Build sewer connection requirement logic
- [ ] Create distance-to-main calculation
- [ ] Implement connection cost estimation (future)
- [ ] Build sewer vs septic determination

### Septic Rules

- [ ] Implement minimum lot size check
- [ ] Build soil suitability check
- [ ] Create drainfield sizing calculator
- [ ] Implement reserve area requirement
- [ ] Build setback-from-structure check
- [ ] Implement setback-from-well check
- [ ] Create setback-from-water check

### Septic Feasibility Assessment

- [ ] Build overall septic feasibility scorer
- [ ] Create limitation aggregator
- [ ] Implement verification prompt generator
- [ ] Build next-steps generator
- [ ] Create perc test recommendation

---

## Phase 2C: Septic Geometry (Week 19-20)

### Drainfield Sizing

- [ ] Build bedroom-based flow calculation
- [ ] Implement perc-rate-adjusted sizing
- [ ] Create drainfield polygon generator
- [ ] Build reserve area generator
- [ ] Implement septic setback buffers

### Buildable Area Update

- [ ] Subtract septic areas from buildable
- [ ] Update restricted area visualization
- [ ] Modify placement recommendations
- [ ] Create septic-aware structure validation
- [ ] Build drainfield-to-structure distance check

### Visualization

- [ ] Create drainfield layer
- [ ] Build reserve area layer
- [ ] Implement septic suitability heatmap
- [ ] Create septic setback display
- [ ] Build legend updates

---

## Phase 2D: Environmental Overlays (Week 21-22)

### Data Integration

- [ ] Import National Wetlands Inventory
- [ ] Integrate FEMA flood zones
- [ ] Import local hazard data
- [ ] Create environmental layer service
- [ ] Build data caching
- [ ] Implement refresh schedules

### Buffer Calculations

- [ ] Build wetland buffer generator
- [ ] Create flood zone buffer (if applicable)
- [ ] Implement stream buffer calculation
- [ ] Build hazard zone buffers
- [ ] Aggregate restricted areas

### Environmental Rules

- [ ] Implement wetland setback rules
- [ ] Build flood zone development rules
- [ ] Create hazard zone restrictions
- [ ] Implement environmental permit triggers
- [ ] Build environmental feasibility scorer

---

## Phase 2E: UX Polish (Week 23-24)

### Performance Optimization

- [ ] Implement map tile caching
- [ ] Optimize spatial queries
- [ ] Add query result caching
- [ ] Implement skeleton loading states
- [ ] Optimize bundle size
- [ ] Add service worker for offline basics

### Accessibility

- [ ] Add keyboard navigation
- [ ] Implement screen reader support
- [ ] Add high contrast mode
- [ ] Ensure 44px touch targets
- [ ] Add focus indicators
- [ ] Test with accessibility tools

### Mobile Optimization

- [ ] Refine bottom sheet behavior
- [ ] Optimize map for touch
- [ ] Improve form usability
- [ ] Test on various devices
- [ ] Implement responsive images
- [ ] Add mobile-specific features

### Final Polish

- [ ] Refine all animations
- [ ] Ensure consistent spacing
- [ ] Audit all copy/text
- [ ] Test all error states
- [ ] Verify loading states
- [ ] User testing sessions

---

## Phase 3: Scale & Expand (Future)

### Data Expansion

- [ ] Add more jurisdictions
- [ ] Improve data coverage mapping
- [ ] Build jurisdiction request system
- [ ] Create data quality scoring
- [ ] Implement automated data updates

### Advanced Features

- [ ] 3D building visualization
- [ ] Sun/shadow analysis
- [ ] View corridor analysis
- [ ] Subdivision planning tools
- [ ] Multi-parcel projects
- [ ] Team collaboration

### API & Integrations

- [ ] Public API for developers
- [ ] Webhook integrations
- [ ] CRM integrations
- [ ] Export to CAD formats
- [ ] Integration with permit systems

### Enterprise

- [ ] White-label option
- [ ] Custom jurisdictions
- [ ] Bulk property analysis
- [ ] API usage tiers
- [ ] Dedicated support

---

## Quality Gates

### Before Phase 1 Launch

- [ ] All core validations working correctly
- [ ] 95%+ test coverage on rule engine
- [ ] Performance: <2s for property load
- [ ] Mobile fully functional
- [ ] Error handling complete
- [ ] Security audit passed

### Before Phase 2 Launch

- [ ] Wastewater data coverage documented
- [ ] Septic sizing validated against regulations
- [ ] Environmental data sources cited
- [ ] Performance maintained
- [ ] User testing complete

### Ongoing

- [ ] Weekly data quality audits
- [ ] Monthly security reviews
- [ ] Quarterly accessibility audits
- [ ] User feedback integration
- [ ] Performance monitoring

---

## Technical Debt Allowances

### Phase 1 (OK to defer)

- Advanced undo/redo (basic OK)
- Multi-language support
- Offline mode
- Advanced analytics

### Phase 2 (OK to defer)

- 3D visualization
- Custom report builder
- API rate limiting dashboard
- Advanced team permissions

### Never Defer

- Security
- Data accuracy
- Core validation logic
- Accessibility basics
- Error handling
- Citation accuracy



