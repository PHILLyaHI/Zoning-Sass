// ============================================
// MOCK DATA CONNECTOR
// ============================================
// Fallback connector for jurisdictions without
// real data sources. Generates consistent mock
// data from coordinates for demo purposes.
// ============================================

import {
  DataConnector,
  CanonicalParcel,
  CanonicalZoning,
  CanonicalLayer,
  CanonicalRule,
  CanonicalUtilityArea,
  Coordinates,
  DataProvenance,
} from "./types";

function mockProvenance(name: string): DataProvenance {
  return {
    sourceType: "derived",
    sourceName: name,
    confidence: "low",
    lastFetched: new Date(),
  };
}

export const mockConnector: DataConnector = {
  name: "Mock Data Provider",
  providerType: "derived",
  supports: ["parcels", "zoning", "environmental", "utilities", "soils"],

  async fetchParcel(point: Coordinates): Promise<CanonicalParcel | null> {
    const seed = Math.abs(Math.sin(point.lat * 1000 + point.lng * 100));
    const lotSqft = 8000 + Math.floor(seed * 40000);

    return {
      apn: `APN-${Math.floor(seed * 1000000)}`,
      areaSqft: lotSqft,
      areaAcres: lotSqft / 43560,
      provenance: mockProvenance("Mock Parcel Generator"),
    };
  },

  async fetchZoning(point: Coordinates): Promise<CanonicalZoning | null> {
    const seed = Math.abs(Math.sin(point.lat * 1000 + point.lng * 100));
    const zones = [
      { code: "R-1", name: "Single Family Residential", category: "residential_single" },
      { code: "R-5", name: "Rural Residential 5-Acre", category: "residential_single" },
      { code: "R-7200", name: "Urban Residential 7200", category: "residential_single" },
      { code: "C-1", name: "Neighborhood Commercial", category: "commercial" },
    ];
    const zone = zones[Math.floor(seed * zones.length)];

    return {
      districtCode: zone.code,
      districtName: zone.name,
      category: zone.category,
      provenance: mockProvenance("Mock Zoning Generator"),
    };
  },

  async fetchLayers(_jurisdiction: string, layerType: string): Promise<CanonicalLayer[]> {
    if (layerType === "flood") {
      return [
        {
          layerType: "flood",
          name: "Zone X (Minimal Risk)",
          provenance: mockProvenance("Mock FEMA Data"),
        },
      ];
    }
    return [];
  },

  async fetchRules(_jurisdictionId: string, _zoningCode: string): Promise<CanonicalRule[]> {
    return [
      {
        ruleType: "setback_front",
        value: 25,
        unit: "feet",
        appliesTo: ["primary_dwelling"],
        ordinanceSection: "Mock Ordinance §12.04",
        provenance: mockProvenance("Mock Rules"),
      },
      {
        ruleType: "setback_side",
        value: 10,
        unit: "feet",
        appliesTo: ["primary_dwelling"],
        ordinanceSection: "Mock Ordinance §12.04",
        provenance: mockProvenance("Mock Rules"),
      },
      {
        ruleType: "height_max",
        value: 35,
        unit: "feet",
        appliesTo: ["primary_dwelling"],
        ordinanceSection: "Mock Ordinance §12.05",
        provenance: mockProvenance("Mock Rules"),
      },
    ];
  },

  async fetchUtilities(point: Coordinates): Promise<CanonicalUtilityArea[]> {
    const seed = Math.abs(Math.cos(point.lat * 500 + point.lng * 200));
    const available = seed < 0.3;

    return [
      {
        utilityType: "sewer",
        providerName: available ? "Mock Sewer District" : "None",
        available,
        provenance: mockProvenance("Mock Utility Data"),
      },
      {
        utilityType: "water",
        providerName: "Mock Water District",
        available: true,
        provenance: mockProvenance("Mock Utility Data"),
      },
    ];
  },
};
