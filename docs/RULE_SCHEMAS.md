# Rule Schemas — Zoning Intelligence Platform

## Zoning Rule Examples

### Setback Rules

```json
{
  "rule_id": "uuid-setback-front-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "setback_front",
  "applies_to": ["primary_dwelling", "adu", "garage"],
  "value_numeric": 25,
  "unit": "feet",
  "condition_expression": null,
  "ordinance_section": "SCC 30.23.040(1)(a)",
  "ordinance_text": "The minimum front yard setback for all structures shall be twenty-five (25) feet from the front property line.",
  "effective_date": "2022-01-01"
}
```

```json
{
  "rule_id": "uuid-setback-side-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "setback_side",
  "applies_to": ["primary_dwelling"],
  "value_numeric": 10,
  "unit": "feet",
  "condition_expression": null,
  "ordinance_section": "SCC 30.23.040(1)(b)",
  "ordinance_text": "Side yard setbacks for the principal structure shall be a minimum of ten (10) feet.",
  "effective_date": "2022-01-01"
}
```

```json
{
  "rule_id": "uuid-setback-accessory-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "accessory_setback",
  "applies_to": ["garage", "shop", "shed"],
  "value_numeric": 5,
  "unit": "feet",
  "condition_expression": {
    "if": {"structure_height": {"$lte": 15}},
    "then": 5,
    "else": 10
  },
  "ordinance_section": "SCC 30.23.040(3)",
  "ordinance_text": "Accessory structures not exceeding 15 feet in height may be located within 5 feet of side and rear property lines.",
  "effective_date": "2022-01-01"
}
```

### Height Rules

```json
{
  "rule_id": "uuid-height-max-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "height_max",
  "applies_to": ["primary_dwelling"],
  "value_numeric": 35,
  "unit": "feet",
  "condition_expression": null,
  "ordinance_section": "SCC 30.23.050",
  "ordinance_text": "The maximum building height for principal structures shall be thirty-five (35) feet.",
  "effective_date": "2022-01-01"
}
```

```json
{
  "rule_id": "uuid-height-max-accessory-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "height_max_accessory",
  "applies_to": ["garage", "shop", "shed", "barn"],
  "value_numeric": 20,
  "unit": "feet",
  "ordinance_section": "SCC 30.23.050(2)",
  "ordinance_text": "Accessory structures shall not exceed twenty (20) feet in height.",
  "effective_date": "2022-01-01"
}
```

### Coverage & FAR Rules

```json
{
  "rule_id": "uuid-lot-coverage-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "lot_coverage_max",
  "applies_to": ["all"],
  "value_numeric": 35,
  "unit": "percent",
  "ordinance_section": "SCC 30.23.060(1)",
  "ordinance_text": "Maximum lot coverage by all structures shall not exceed 35% of the total lot area.",
  "effective_date": "2022-01-01"
}
```

```json
{
  "rule_id": "uuid-far-max-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "far_max",
  "applies_to": ["all"],
  "value_numeric": 0.5,
  "unit": "ratio",
  "ordinance_section": "SCC 30.23.060(2)",
  "ordinance_text": "Floor area ratio shall not exceed 0.5:1.",
  "effective_date": "2022-01-01"
}
```

### ADU Rules

```json
{
  "rule_id": "uuid-adu-allowed-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "adu_allowed",
  "applies_to": ["adu", "dadu"],
  "value_text": "permitted",
  "condition_expression": {
    "requires": ["primary_dwelling_exists", "lot_size_min_7500"]
  },
  "ordinance_section": "SCC 30.23.110",
  "ordinance_text": "One accessory dwelling unit is permitted per lot containing a single-family dwelling on lots of 7,500 square feet or larger.",
  "effective_date": "2023-07-01"
}
```

```json
{
  "rule_id": "uuid-adu-size-max-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "adu_size_max",
  "applies_to": ["adu", "dadu"],
  "value_json": {
    "max_sqft": 1000,
    "max_percent_of_primary": 50,
    "use_lesser": true
  },
  "unit": "sqft",
  "ordinance_section": "SCC 30.23.110(3)",
  "ordinance_text": "The ADU shall not exceed 1,000 square feet or 50% of the primary dwelling floor area, whichever is less.",
  "effective_date": "2023-07-01"
}
```

### Lot Size Rules

```json
{
  "rule_id": "uuid-lot-size-min-r1",
  "jurisdiction_id": "uuid-snohomish-county",
  "district_id": "uuid-r1-residential",
  "rule_type": "lot_size_min",
  "applies_to": ["parcel"],
  "value_numeric": 12500,
  "unit": "sqft",
  "ordinance_section": "SCC 30.23.030(1)",
  "ordinance_text": "Minimum lot size in the R-7200 zone shall be 12,500 square feet for new subdivisions.",
  "effective_date": "2022-01-01"
}
```

---

## Wastewater Rule Examples (Phase 2)

### Sewer Rules

```json
{
  "rule_id": "uuid-sewer-connection-required",
  "jurisdiction_id": "uuid-snohomish-county",
  "rule_type": "sewer_connection_required",
  "applies_to": ["parcel"],
  "value_json": {
    "when_available": true,
    "distance_threshold_feet": 200,
    "exceptions": ["agricultural_use", "lot_size_over_5_acres"]
  },
  "regulation_source": "SCC 30.66.010",
  "regulation_section": "Connection to Public Sewer",
  "ordinance_text": "Connection to public sewer is required when sewer is available within 200 feet of the property line.",
  "effective_date": "2020-01-01"
}
```

### Septic Rules

```json
{
  "rule_id": "uuid-septic-min-lot-size",
  "jurisdiction_id": "uuid-snohomish-county",
  "rule_type": "min_lot_size",
  "applies_to": ["septic_system"],
  "value_numeric": 12500,
  "unit": "sqft",
  "condition_expression": {
    "without_public_water": 15000
  },
  "regulation_source": "WAC 246-272A-0230",
  "regulation_section": "Minimum Lot Size",
  "notes": "Larger lot required if using private well"
}
```

```json
{
  "rule_id": "uuid-septic-setback-structure",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "setback_structure",
  "applies_to": ["septic_drainfield", "septic_tank"],
  "value_json": {
    "to_building_foundation": 10,
    "to_basement": 20,
    "to_pool": 10
  },
  "unit": "feet",
  "regulation_source": "WAC 246-272A-0210",
  "regulation_section": "Table 4 - Horizontal Separations"
}
```

```json
{
  "rule_id": "uuid-septic-setback-well",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "setback_well",
  "applies_to": ["septic_drainfield"],
  "value_numeric": 100,
  "unit": "feet",
  "regulation_source": "WAC 246-272A-0210",
  "regulation_section": "Table 4 - Horizontal Separations",
  "notes": "Distance from drainfield to any well"
}
```

```json
{
  "rule_id": "uuid-septic-setback-water",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "setback_water_body",
  "applies_to": ["septic_drainfield"],
  "value_json": {
    "streams": 100,
    "lakes": 100,
    "wetlands": 100,
    "marine": 100
  },
  "unit": "feet",
  "regulation_source": "WAC 246-272A-0210",
  "regulation_section": "Table 4 - Horizontal Separations"
}
```

```json
{
  "rule_id": "uuid-drainfield-sizing",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "drainfield_size_per_bedroom",
  "applies_to": ["septic_drainfield"],
  "value_json": {
    "base_sqft_per_bedroom": 450,
    "perc_rate_adjustments": {
      "less_than_1_mpi": 0.5,
      "1_to_10_mpi": 1.0,
      "10_to_30_mpi": 1.5,
      "30_to_60_mpi": 2.0,
      "over_60_mpi": "not_suitable"
    }
  },
  "unit": "sqft",
  "regulation_source": "WAC 246-272A-0234",
  "regulation_section": "Sizing OSS Components",
  "notes": "mpi = minutes per inch (perc rate)"
}
```

```json
{
  "rule_id": "uuid-reserve-area-required",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "reserve_area_required",
  "applies_to": ["septic_drainfield"],
  "value_json": {
    "required": true,
    "size_percent_of_primary": 100,
    "must_be_contiguous": false,
    "can_be_on_adjacent_parcel": false
  },
  "regulation_source": "WAC 246-272A-0200",
  "regulation_section": "Reserve Drainfield Area"
}
```

### Soil Suitability Rules

```json
{
  "rule_id": "uuid-soil-type-prohibited",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "soil_type_prohibited",
  "applies_to": ["conventional_septic"],
  "value_json": {
    "prohibited_conditions": [
      "hydric_soils",
      "depth_to_water_less_than_24_inches",
      "depth_to_restrictive_less_than_36_inches",
      "slope_greater_than_45_percent"
    ]
  },
  "regulation_source": "WAC 246-272A-0220",
  "regulation_section": "Site Evaluation Requirements"
}
```

```json
{
  "rule_id": "uuid-perc-rate-limits",
  "jurisdiction_id": "uuid-washington-state",
  "rule_type": "perc_rate_min",
  "applies_to": ["conventional_septic"],
  "value_json": {
    "min_mpi": 1,
    "max_mpi": 60,
    "under_1_mpi": "requires_pressure_distribution",
    "over_60_mpi": "not_suitable_for_conventional"
  },
  "unit": "minutes_per_inch",
  "regulation_source": "WAC 246-272A-0230"
}
```

---

## Validation Result Schema

```json
{
  "validation_id": "uuid-validation-result",
  "project_id": "uuid-project",
  "computed_at": "2025-01-19T12:00:00Z",
  "overall_status": "warn",
  
  "buildable_area_polygon": {
    "type": "Polygon",
    "coordinates": [[[...], [...], ...]]
  },
  
  "restricted_area_polygons": [
    {
      "type": "wetland_buffer",
      "geometry": {...},
      "source": "NWI + local buffer rule",
      "citation": "SCC 30.62.300"
    },
    {
      "type": "front_setback",
      "geometry": {...},
      "source": "zoning_rule",
      "citation": "SCC 30.23.040(1)(a)"
    }
  ],
  
  "checks": [
    {
      "check_id": "chk-001",
      "rule_id": "uuid-setback-front-r1",
      "rule_type": "setback_front",
      "structure_id": "uuid-primary-dwelling",
      "status": "pass",
      "measured_value": 28.5,
      "required_value": 25,
      "unit": "feet",
      "margin": 3.5,
      "citations": [
        {
          "source": "Snohomish County Code",
          "section": "SCC 30.23.040(1)(a)",
          "text": "The minimum front yard setback for all structures shall be twenty-five (25) feet..."
        }
      ]
    },
    {
      "check_id": "chk-002",
      "rule_id": "uuid-setback-side-r1",
      "rule_type": "setback_side",
      "structure_id": "uuid-primary-dwelling",
      "status": "warn",
      "measured_value": null,
      "required_value": 10,
      "unit": "feet",
      "reason": "Unable to determine side property line from parcel geometry",
      "citations": [
        {
          "source": "Snohomish County Code",
          "section": "SCC 30.23.040(1)(b)"
        }
      ]
    },
    {
      "check_id": "chk-003",
      "rule_id": "uuid-height-max-r1",
      "rule_type": "height_max",
      "structure_id": "uuid-primary-dwelling",
      "status": "fail",
      "measured_value": 38,
      "required_value": 35,
      "unit": "feet",
      "excess": 3,
      "citations": [
        {
          "source": "Snohomish County Code",
          "section": "SCC 30.23.050",
          "text": "The maximum building height for principal structures shall be thirty-five (35) feet."
        }
      ]
    },
    {
      "check_id": "chk-004",
      "rule_id": "uuid-lot-coverage-r1",
      "rule_type": "lot_coverage_max",
      "structure_id": null,
      "status": "pass",
      "measured_value": 22.3,
      "required_value": 35,
      "unit": "percent",
      "margin": 12.7,
      "citations": [
        {
          "source": "Snohomish County Code",
          "section": "SCC 30.23.060(1)"
        }
      ]
    },
    {
      "check_id": "chk-005",
      "rule_id": "uuid-septic-setback-structure",
      "rule_type": "septic_structure_distance",
      "structure_id": "uuid-primary-dwelling",
      "related_feature_id": "uuid-drainfield",
      "status": "pass",
      "measured_value": 15,
      "required_value": 10,
      "unit": "feet",
      "citations": [
        {
          "source": "WAC 246-272A-0210",
          "section": "Table 4"
        }
      ]
    }
  ],
  
  "data_gaps": [
    {
      "gap_id": "gap-001",
      "type": "missing_rule",
      "description": "Rear setback rule not found for zone R-7200",
      "impact": "Cannot validate rear setback",
      "suggested_action": "Contact Snohomish County Planning for clarification"
    },
    {
      "gap_id": "gap-002",
      "type": "missing_data",
      "description": "Soil perc rate not available for this parcel",
      "impact": "Septic drainfield sizing is estimated",
      "suggested_action": "Perc test required before final design"
    }
  ],
  
  "summary": {
    "passing_checks": 3,
    "warning_checks": 1,
    "failing_checks": 1,
    "total_checks": 5,
    "critical_issues": [
      "Structure height exceeds maximum by 3 feet"
    ],
    "verification_needed": [
      "Side setback measurement",
      "Soil perc test"
    ]
  }
}
```

---

## Condition Expression Syntax

Rules can have conditional logic using a simple expression language:

```json
{
  "condition_expression": {
    "if": {
      "and": [
        {"lot_size": {"$gte": 7500}},
        {"structure_type": {"$eq": "adu"}},
        {"primary_dwelling_exists": true}
      ]
    },
    "then": {
      "value": 5,
      "unit": "feet"
    },
    "else": {
      "value": 10,
      "unit": "feet"
    }
  }
}
```

Supported operators:
- `$eq`, `$ne` — equals, not equals
- `$gt`, `$gte`, `$lt`, `$lte` — comparisons
- `$in`, `$nin` — value in array
- `$and`, `$or`, `$not` — logical operators
- `$exists` — field exists



