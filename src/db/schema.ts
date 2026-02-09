// ============================================
// DATABASE SCHEMA — Drizzle ORM + PostGIS
// ============================================

import { 
  pgTable, 
  text, 
  timestamp, 
  uuid, 
  varchar, 
  integer, 
  boolean, 
  real, 
  json,
  index,
  primaryKey
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// USERS & AUTH
// ============================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  clerkId: varchar("clerk_id", { length: 255 }).unique(),
  plan: varchar("plan", { length: 50 }).default("free_trial"),
  planStatus: varchar("plan_status", { length: 50 }).default("trialing"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodEnd: timestamp("current_period_end"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// JURISDICTIONS & ZONING
// ============================================

export const jurisdictions = pgTable("jurisdictions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // city, county, township, special_district
  stateCode: varchar("state_code", { length: 2 }).notNull(),
  fipsCode: varchar("fips_code", { length: 10 }),
  parentJurisdictionId: uuid("parent_jurisdiction_id"),
  dataQuality: varchar("data_quality", { length: 50 }).default("unknown"),
  lastOrdinanceUpdate: timestamp("last_ordinance_update"),
  boundaryGeojson: json("boundary_geojson"), // GeoJSON polygon
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  stateCodeIdx: index("jurisdictions_state_code_idx").on(table.stateCode),
  typeIdx: index("jurisdictions_type_idx").on(table.type),
}));

export const zoningDistricts = pgTable("zoning_districts", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").notNull().references(() => jurisdictions.id),
  code: varchar("code", { length: 50 }).notNull(), // e.g., "R-1", "C-2"
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // residential_single, commercial, etc.
  description: text("description"),
  ordinanceSection: varchar("ordinance_section", { length: 100 }),
  effectiveDate: timestamp("effective_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  jurisdictionIdx: index("zoning_districts_jurisdiction_idx").on(table.jurisdictionId),
  codeIdx: index("zoning_districts_code_idx").on(table.code),
}));

export const zoningPolygons = pgTable("zoning_polygons", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").notNull().references(() => jurisdictions.id),
  districtId: uuid("district_id").notNull().references(() => zoningDistricts.id),
  geojson: json("geojson").notNull(), // GeoJSON polygon - in production use PostGIS geometry
  source: varchar("source", { length: 255 }),
  sourceId: varchar("source_id", { length: 255 }),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  jurisdictionIdx: index("zoning_polygons_jurisdiction_idx").on(table.jurisdictionId),
  districtIdx: index("zoning_polygons_district_idx").on(table.districtId),
}));

// ============================================
// ZONING RULES
// ============================================

export const zoningRules = pgTable("zoning_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").notNull().references(() => jurisdictions.id),
  districtId: uuid("district_id").references(() => zoningDistricts.id), // null = applies to all
  ruleType: varchar("rule_type", { length: 100 }).notNull(),
  appliesTo: json("applies_to").$type<string[]>().notNull(), // structure types
  valueNumeric: real("value_numeric"),
  valueText: text("value_text"),
  valueJson: json("value_json"),
  unit: varchar("unit", { length: 50 }),
  conditionExpression: json("condition_expression"),
  ordinanceSection: varchar("ordinance_section", { length: 100 }).notNull(),
  ordinanceText: text("ordinance_text"),
  effectiveDate: timestamp("effective_date"),
  expirationDate: timestamp("expiration_date"),
  notes: text("notes"),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  jurisdictionIdx: index("zoning_rules_jurisdiction_idx").on(table.jurisdictionId),
  districtIdx: index("zoning_rules_district_idx").on(table.districtId),
  ruleTypeIdx: index("zoning_rules_type_idx").on(table.ruleType),
}));

// ============================================
// PROPERTIES & PROJECTS
// ============================================

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  address: text("address").notNull(),
  addressNormalized: text("address_normalized"),
  city: varchar("city", { length: 255 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zip_code", { length: 10 }),
  county: varchar("county", { length: 255 }),
  apn: varchar("apn", { length: 100 }),
  parcelId: varchar("parcel_id", { length: 255 }),
  centroidLat: real("centroid_lat"),
  centroidLng: real("centroid_lng"),
  parcelGeojson: json("parcel_geojson"), // GeoJSON polygon
  areaSqft: real("area_sqft"),
  areaAcres: real("area_acres"),
  lotWidth: real("lot_width"),
  lotDepth: real("lot_depth"),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  zoningDistrictId: uuid("zoning_district_id").references(() => zoningDistricts.id),
  overlayZones: json("overlay_zones").$type<string[]>(),
  feasibilitySnapshot: json("feasibility_snapshot"),
  activeLayers: json("active_layers").$type<string[]>(),
  lastAnalysisAt: timestamp("last_analysis_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("properties_user_idx").on(table.userId),
  jurisdictionIdx: index("properties_jurisdiction_idx").on(table.jurisdictionId),
  stateIdx: index("properties_state_idx").on(table.state),
}));

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  propertyId: uuid("property_id").notNull().references(() => properties.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("draft"),
  originalParcelGeojson: json("original_parcel_geojson"),
  projectParcelGeojson: json("project_parcel_geojson"),
  computedBuildableArea: json("computed_buildable_area"),
  computedSetbackLines: json("computed_setback_lines"),
  computedRestrictedAreas: json("computed_restricted_areas"),
  lastValidation: json("last_validation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("projects_user_idx").on(table.userId),
  propertyIdx: index("projects_property_idx").on(table.propertyId),
}));

export const structures = pgTable("structures", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id),
  structureType: varchar("structure_type", { length: 100 }).notNull(),
  useType: varchar("use_type", { length: 100 }),
  label: varchar("label", { length: 255 }),
  footprintGeojson: json("footprint_geojson").notNull(),
  footprintSqft: real("footprint_sqft"),
  heightFeet: real("height_feet"),
  stories: integer("stories").default(1),
  bedrooms: integer("bedrooms"),
  bathrooms: real("bathrooms"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  projectIdx: index("structures_project_idx").on(table.projectId),
  typeIdx: index("structures_type_idx").on(table.structureType),
}));

// ============================================
// WASTEWATER & UTILITIES (Phase 2)
// ============================================

export const sewerServiceAreas = pgTable("sewer_service_areas", {
  id: uuid("id").primaryKey().defaultRandom(),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  providerName: varchar("provider_name", { length: 255 }).notNull(),
  providerType: varchar("provider_type", { length: 50 }),
  geojson: json("geojson").notNull(),
  connectionRequired: boolean("connection_required").default(false),
  connectionAvailable: boolean("connection_available").default(true),
  source: varchar("source", { length: 255 }),
  sourceDate: timestamp("source_date"),
  confidence: varchar("confidence", { length: 50 }).default("unknown"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const soilUnits = pgTable("soil_units", {
  id: uuid("id").primaryKey().defaultRandom(),
  mukey: varchar("mukey", { length: 50 }).notNull(),
  musym: varchar("musym", { length: 50 }),
  muname: varchar("muname", { length: 255 }),
  geojson: json("geojson").notNull(),
  septicSuitability: varchar("septic_suitability", { length: 50 }),
  septicLimitations: json("septic_limitations").$type<string[]>(),
  drainageClass: varchar("drainage_class", { length: 100 }),
  hydricRating: varchar("hydric_rating", { length: 50 }),
  depthToWaterTableMin: real("depth_to_water_table_min"),
  depthToRestrictiveLayer: real("depth_to_restrictive_layer"),
  slopeLow: real("slope_low"),
  slopeHigh: real("slope_high"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  mukeyIdx: index("soil_units_mukey_idx").on(table.mukey),
}));

// ============================================
// ENVIRONMENTAL OVERLAYS
// ============================================

export const wetlands = pgTable("wetlands", {
  id: uuid("id").primaryKey().defaultRandom(),
  geojson: json("geojson").notNull(),
  wetlandType: varchar("wetland_type", { length: 100 }),
  classification: varchar("classification", { length: 100 }),
  source: varchar("source", { length: 255 }),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  bufferRequiredFeet: real("buffer_required_feet"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const floodZones = pgTable("flood_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  geojson: json("geojson").notNull(),
  zoneCode: varchar("zone_code", { length: 10 }).notNull(),
  zoneSubtype: varchar("zone_subtype", { length: 50 }),
  baseFloodElevation: real("base_flood_elevation"),
  source: varchar("source", { length: 255 }),
  panelNumber: varchar("panel_number", { length: 50 }),
  effectiveDate: timestamp("effective_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const hazardZones = pgTable("hazard_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  geojson: json("geojson").notNull(),
  hazardType: varchar("hazard_type", { length: 100 }).notNull(),
  severity: varchar("severity", { length: 50 }),
  jurisdictionId: uuid("jurisdiction_id").references(() => jurisdictions.id),
  source: varchar("source", { length: 255 }),
  sourceDate: timestamp("source_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ many }) => ({
  properties: many(properties),
  projects: many(projects),
}));

export const jurisdictionsRelations = relations(jurisdictions, ({ many, one }) => ({
  zoningDistricts: many(zoningDistricts),
  zoningRules: many(zoningRules),
  parent: one(jurisdictions, {
    fields: [jurisdictions.parentJurisdictionId],
    references: [jurisdictions.id],
  }),
}));

export const zoningDistrictsRelations = relations(zoningDistricts, ({ one, many }) => ({
  jurisdiction: one(jurisdictions, {
    fields: [zoningDistricts.jurisdictionId],
    references: [jurisdictions.id],
  }),
  rules: many(zoningRules),
  polygons: many(zoningPolygons),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  user: one(users, {
    fields: [properties.userId],
    references: [users.id],
  }),
  jurisdiction: one(jurisdictions, {
    fields: [properties.jurisdictionId],
    references: [jurisdictions.id],
  }),
  zoningDistrict: one(zoningDistricts, {
    fields: [properties.zoningDistrictId],
    references: [zoningDistricts.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [projects.propertyId],
    references: [properties.id],
  }),
  structures: many(structures),
}));

export const structuresRelations = relations(structures, ({ one }) => ({
  project: one(projects, {
    fields: [structures.projectId],
    references: [projects.id],
  }),
}));



