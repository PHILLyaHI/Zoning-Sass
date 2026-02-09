# Database Schema — Zoning Intelligence Platform

## Core Tables (Phase 1)

### Jurisdictions & Zoning

```sql
-- Jurisdictions (cities, counties, special districts)
CREATE TABLE jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('city', 'county', 'township', 'special_district')),
  state_code CHAR(2) NOT NULL,
  fips_code TEXT,
  parent_jurisdiction_id UUID REFERENCES jurisdictions(id),
  boundary GEOMETRY(MultiPolygon, 4326),
  data_quality TEXT CHECK (data_quality IN ('verified', 'partial', 'unknown')),
  last_ordinance_update DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Zoning Districts
CREATE TABLE zoning_districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  code TEXT NOT NULL, -- e.g., "R-1", "C-2", "MU-3"
  name TEXT NOT NULL, -- e.g., "Single Family Residential"
  category TEXT NOT NULL CHECK (category IN (
    'residential_single', 'residential_multi', 'commercial', 
    'industrial', 'agricultural', 'mixed_use', 'special', 'overlay'
  )),
  description TEXT,
  ordinance_section TEXT, -- e.g., "Chapter 12.04"
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jurisdiction_id, code)
);

-- Zoning Polygons (spatial)
CREATE TABLE zoning_polygons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  district_id UUID NOT NULL REFERENCES zoning_districts(id),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  source TEXT NOT NULL,
  source_layer TEXT,
  last_updated DATE,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zoning_polygons_geom ON zoning_polygons USING GIST(geometry);
```

### Zoning Rules

```sql
-- Rule Definitions
CREATE TABLE zoning_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  district_id UUID REFERENCES zoning_districts(id), -- NULL = applies to all
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'setback_front', 'setback_side', 'setback_rear', 'setback_street_side',
    'height_max', 'height_max_accessory',
    'lot_coverage_max', 'impervious_coverage_max',
    'far_max', 'far_min',
    'lot_size_min', 'lot_width_min', 'lot_depth_min',
    'dwelling_units_max', 'density_max',
    'use_permitted', 'use_conditional', 'use_prohibited',
    'parking_required', 'adu_allowed', 'adu_size_max',
    'structure_separation', 'accessory_setback'
  )),
  applies_to TEXT[], -- ['primary', 'adu', 'accessory', 'garage', 'pool']
  condition_expression JSONB, -- optional conditional logic
  value_numeric DECIMAL,
  value_text TEXT,
  value_json JSONB,
  unit TEXT, -- 'feet', 'meters', 'percent', 'units', 'sqft'
  ordinance_section TEXT NOT NULL,
  ordinance_text TEXT,
  effective_date DATE,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zoning_rules_lookup ON zoning_rules(jurisdiction_id, district_id, rule_type);

-- Permitted Uses
CREATE TABLE permitted_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  district_id UUID NOT NULL REFERENCES zoning_districts(id),
  use_category TEXT NOT NULL,
  use_subcategory TEXT,
  use_name TEXT NOT NULL,
  permission_type TEXT NOT NULL CHECK (permission_type IN (
    'permitted', 'conditional', 'accessory', 'prohibited'
  )),
  conditions JSONB,
  ordinance_section TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Properties & Parcels

```sql
-- Properties (user-saved)
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address TEXT NOT NULL,
  address_normalized TEXT,
  city TEXT,
  state_code CHAR(2),
  zip_code TEXT,
  county TEXT,
  apn TEXT,
  parcel_id UUID REFERENCES parcels(id),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  zoning_district_id UUID REFERENCES zoning_districts(id),
  centroid GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_analysis_at TIMESTAMPTZ
);

-- Parcels (cached from external sources)
CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apn TEXT,
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  centroid GEOMETRY(Point, 4326),
  area_sqft DECIMAL,
  area_acres DECIMAL,
  lot_width DECIMAL,
  lot_depth DECIMAL,
  legal_description TEXT,
  owner_name TEXT,
  source TEXT NOT NULL,
  source_id TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_parcels_geom ON parcels USING GIST(geometry);
CREATE INDEX idx_parcels_apn ON parcels(apn);
```

### Projects & Structures

```sql
-- Projects (user design sessions)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  original_parcel_geometry GEOMETRY(MultiPolygon, 4326),
  project_parcel_geometry GEOMETRY(MultiPolygon, 4326),
  computed_buildable_area GEOMETRY(MultiPolygon, 4326),
  computed_setback_lines JSONB, -- {front: geom, rear: geom, ...}
  computed_restricted_areas JSONB, -- [{type: 'wetland_buffer', geom: ...}]
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Structures (placed by user)
CREATE TABLE structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  structure_type TEXT NOT NULL CHECK (structure_type IN (
    'primary_dwelling', 'adu', 'dadu', 'garage', 'carport',
    'shop', 'barn', 'pool', 'deck', 'patio', 'shed', 'other'
  )),
  use_type TEXT, -- 'residential', 'accessory', 'storage'
  footprint GEOMETRY(Polygon, 4326) NOT NULL,
  footprint_sqft DECIMAL,
  height_feet DECIMAL,
  stories INTEGER,
  bedrooms INTEGER,
  bathrooms DECIMAL,
  label TEXT,
  metadata JSONB, -- flexible additional data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_structures_project ON structures(project_id);
```

### Validation Results

```sql
-- Validation Snapshots
CREATE TABLE validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('pass', 'warn', 'fail')),
  checks JSONB NOT NULL, -- array of check results
  data_gaps TEXT[], -- list of missing data
  rules_applied UUID[], -- references to zoning_rules used
  valid_until TIMESTAMPTZ -- cache expiration
);
```

## Wastewater & Utilities Tables (Phase 2)

```sql
-- Sewer Service Areas
CREATE TABLE sewer_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  provider_name TEXT NOT NULL,
  provider_type TEXT CHECK (provider_type IN ('municipal', 'district', 'private')),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  connection_required BOOLEAN, -- is connection mandatory?
  connection_available BOOLEAN, -- is infrastructure present?
  source TEXT NOT NULL,
  source_date DATE,
  confidence TEXT CHECK (confidence IN ('verified', 'inferred', 'unknown')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sewer_service_geom ON sewer_service_areas USING GIST(geometry);

-- Water Service Areas
CREATE TABLE water_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  provider_name TEXT NOT NULL,
  provider_type TEXT CHECK (provider_type IN ('municipal', 'district', 'private', 'well_required')),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  source TEXT NOT NULL,
  source_date DATE,
  confidence TEXT CHECK (confidence IN ('verified', 'inferred', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_water_service_geom ON water_service_areas USING GIST(geometry);

-- Septic Rules
CREATE TABLE septic_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_id UUID NOT NULL REFERENCES jurisdictions(id),
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'min_lot_size', 'min_lot_size_with_well',
    'setback_structure', 'setback_well', 'setback_property_line',
    'setback_water_body', 'setback_wetland',
    'drainfield_size_per_bedroom', 'reserve_area_required',
    'soil_type_allowed', 'soil_type_prohibited',
    'perc_rate_min', 'perc_rate_max',
    'max_slope', 'min_depth_to_water', 'min_depth_to_restrictive'
  )),
  value_numeric DECIMAL,
  value_text TEXT,
  value_json JSONB,
  unit TEXT,
  regulation_source TEXT NOT NULL, -- e.g., "WAC 246-272A"
  regulation_section TEXT,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Soil Data (from USDA/NRCS SSURGO)
CREATE TABLE soil_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mukey TEXT NOT NULL, -- SSURGO map unit key
  musym TEXT, -- map unit symbol
  muname TEXT, -- map unit name
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  -- Septic-relevant properties
  septic_suitability TEXT CHECK (septic_suitability IN (
    'well_suited', 'somewhat_limited', 'very_limited', 'not_rated'
  )),
  septic_limitations TEXT[],
  drainage_class TEXT,
  hydric_rating TEXT,
  depth_to_water_table_min DECIMAL, -- cm
  depth_to_restrictive_layer DECIMAL, -- cm
  flooding_frequency TEXT,
  ponding_frequency TEXT,
  slope_low DECIMAL,
  slope_high DECIMAL,
  source TEXT DEFAULT 'SSURGO',
  source_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_soil_units_geom ON soil_units USING GIST(geometry);

-- Project Wastewater (extends projects)
CREATE TABLE project_wastewater (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  wastewater_method TEXT CHECK (wastewater_method IN (
    'public_sewer', 'septic', 'unknown', 'verification_required'
  )),
  sewer_available BOOLEAN,
  sewer_required BOOLEAN,
  septic_feasible TEXT CHECK (septic_feasible IN ('yes', 'conditional', 'no', 'unknown')),
  septic_limitations TEXT[],
  estimated_daily_flow_gpd DECIMAL, -- gallons per day
  drainfield_area GEOMETRY(Polygon, 4326),
  reserve_area GEOMETRY(Polygon, 4326),
  soil_types_present TEXT[],
  data_gaps TEXT[],
  computed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Environmental Overlays (Phase 2)

```sql
-- Wetlands (NWI + local)
CREATE TABLE wetlands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  wetland_type TEXT, -- e.g., "PFO1A" (Palustrine Forested)
  classification TEXT,
  source TEXT NOT NULL, -- 'NWI', 'local_inventory'
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  buffer_required_feet DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wetlands_geom ON wetlands USING GIST(geometry);

-- Flood Zones (FEMA)
CREATE TABLE flood_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  zone_code TEXT NOT NULL, -- 'A', 'AE', 'AO', 'X', 'VE', etc.
  zone_subtype TEXT,
  bfe DECIMAL, -- Base Flood Elevation
  static_bfe DECIMAL,
  source TEXT DEFAULT 'FEMA NFHL',
  panel_number TEXT,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flood_zones_geom ON flood_zones USING GIST(geometry);

-- Hazards (fire, landslide, etc.)
CREATE TABLE hazard_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  hazard_type TEXT NOT NULL CHECK (hazard_type IN (
    'wildfire', 'landslide', 'liquefaction', 'erosion', 'seismic', 'other'
  )),
  severity TEXT CHECK (severity IN ('low', 'moderate', 'high', 'very_high')),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  source TEXT NOT NULL,
  source_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hazard_zones_geom ON hazard_zones USING GIST(geometry);
```

## Data Provenance

```sql
-- Track all data sources and updates
CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'parcel', 'zoning', 'ordinance', 'sewer', 'water', 
    'septic', 'soil', 'wetland', 'flood', 'hazard'
  )),
  jurisdiction_id UUID REFERENCES jurisdictions(id),
  provider TEXT,
  url TEXT,
  api_endpoint TEXT,
  last_fetched TIMESTAMPTZ,
  last_verified TIMESTAMPTZ,
  update_frequency TEXT, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
  coverage_notes TEXT,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for rule changes
CREATE TABLE rule_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES zoning_rules(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  old_value JSONB,
  new_value JSONB,
  changed_by UUID,
  change_reason TEXT,
  ordinance_amendment TEXT,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Indexes Summary

```sql
-- Spatial indexes (critical for performance)
CREATE INDEX idx_zoning_polygons_geom ON zoning_polygons USING GIST(geometry);
CREATE INDEX idx_parcels_geom ON parcels USING GIST(geometry);
CREATE INDEX idx_sewer_service_geom ON sewer_service_areas USING GIST(geometry);
CREATE INDEX idx_water_service_geom ON water_service_areas USING GIST(geometry);
CREATE INDEX idx_soil_units_geom ON soil_units USING GIST(geometry);
CREATE INDEX idx_wetlands_geom ON wetlands USING GIST(geometry);
CREATE INDEX idx_flood_zones_geom ON flood_zones USING GIST(geometry);
CREATE INDEX idx_hazard_zones_geom ON hazard_zones USING GIST(geometry);

-- Lookup indexes
CREATE INDEX idx_properties_user ON properties(user_id);
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_zoning_rules_lookup ON zoning_rules(jurisdiction_id, district_id, rule_type);
CREATE INDEX idx_parcels_apn ON parcels(apn);
```



