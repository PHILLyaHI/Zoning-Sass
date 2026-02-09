# OpenAI Prompt Templates — Zoning Intelligence Platform

## Core Principles

1. **OpenAI is NEVER the source of truth**
2. **All factual data comes from deterministic sources**
3. **AI explains results, it does not generate them**
4. **Every AI response must cite provided data**
5. **If data is missing, AI must say "unknown" + explain how to verify**

---

## Template 1: Ordinance → Rules (JSON Only)

### Purpose
Convert ordinance text into structured rule objects for the rule engine.

### System Prompt

```
You are a municipal code parser. Your ONLY job is to extract zoning rules from ordinance text and output valid JSON.

RULES:
1. Output ONLY valid JSON. No markdown, no explanation, no commentary.
2. Extract ONLY what is explicitly stated in the ordinance text.
3. Do NOT infer, assume, or add rules that are not explicitly stated.
4. If a value is unclear, set it to null and add a note.
5. Always include the exact ordinance section reference.
6. Use standardized rule_type values from the allowed list.

ALLOWED rule_type VALUES:
- setback_front, setback_side, setback_rear, setback_street_side
- height_max, height_max_accessory
- lot_coverage_max, impervious_coverage_max
- far_max, far_min
- lot_size_min, lot_width_min, lot_depth_min
- dwelling_units_max, density_max
- use_permitted, use_conditional, use_prohibited
- parking_required
- adu_allowed, adu_size_max, adu_setback
- structure_separation, accessory_setback

OUTPUT SCHEMA:
{
  "jurisdiction": string,
  "district_code": string,
  "district_name": string,
  "ordinance_section": string,
  "effective_date": string | null,
  "rules": [
    {
      "rule_type": string,
      "applies_to": string[],
      "value_numeric": number | null,
      "value_text": string | null,
      "value_json": object | null,
      "unit": string,
      "condition_expression": object | null,
      "ordinance_text": string,
      "notes": string | null
    }
  ],
  "parsing_warnings": string[]
}
```

### User Prompt Template

```
Parse the following ordinance text into structured zoning rules.

JURISDICTION: {{jurisdiction_name}}
DISTRICT CODE: {{district_code}}
ORDINANCE SECTION: {{ordinance_section}}

---BEGIN ORDINANCE TEXT---
{{ordinance_text}}
---END ORDINANCE TEXT---

Output valid JSON only.
```

### Example Input

```
JURISDICTION: Snohomish County, WA
DISTRICT CODE: R-7200
ORDINANCE SECTION: SCC 30.23.040

---BEGIN ORDINANCE TEXT---
30.23.040 Development standards.
(1) Setbacks.
  (a) Front yard: The minimum front yard setback for all structures shall be twenty-five (25) feet from the front property line.
  (b) Side yard: Side yard setbacks for the principal structure shall be a minimum of ten (10) feet. Accessory structures not exceeding 15 feet in height may be located within 5 feet of side property lines.
  (c) Rear yard: The minimum rear yard setback shall be twenty (20) feet for principal structures and five (5) feet for accessory structures.
  (d) Street side yard: Corner lots shall maintain a fifteen (15) foot setback on the street side.
---END ORDINANCE TEXT---
```

### Example Output

```json
{
  "jurisdiction": "Snohomish County, WA",
  "district_code": "R-7200",
  "district_name": null,
  "ordinance_section": "SCC 30.23.040",
  "effective_date": null,
  "rules": [
    {
      "rule_type": "setback_front",
      "applies_to": ["all"],
      "value_numeric": 25,
      "value_text": null,
      "value_json": null,
      "unit": "feet",
      "condition_expression": null,
      "ordinance_text": "The minimum front yard setback for all structures shall be twenty-five (25) feet from the front property line.",
      "notes": null
    },
    {
      "rule_type": "setback_side",
      "applies_to": ["primary_dwelling"],
      "value_numeric": 10,
      "value_text": null,
      "value_json": null,
      "unit": "feet",
      "condition_expression": null,
      "ordinance_text": "Side yard setbacks for the principal structure shall be a minimum of ten (10) feet.",
      "notes": null
    },
    {
      "rule_type": "accessory_setback",
      "applies_to": ["accessory"],
      "value_numeric": 5,
      "value_text": null,
      "value_json": null,
      "unit": "feet",
      "condition_expression": {
        "if": {"structure_height": {"$lte": 15}},
        "then": 5,
        "else": null
      },
      "ordinance_text": "Accessory structures not exceeding 15 feet in height may be located within 5 feet of side property lines.",
      "notes": "Setback for accessory structures over 15 feet is not specified in this section"
    },
    {
      "rule_type": "setback_rear",
      "applies_to": ["primary_dwelling"],
      "value_numeric": 20,
      "value_text": null,
      "value_json": null,
      "unit": "feet",
      "condition_expression": null,
      "ordinance_text": "The minimum rear yard setback shall be twenty (20) feet for principal structures",
      "notes": null
    },
    {
      "rule_type": "setback_rear",
      "applies_to": ["accessory"],
      "value_numeric": 5,
      "value_text": null,
      "value_json": null,
      "unit": "feet",
      "condition_expression": null,
      "ordinance_text": "five (5) feet for accessory structures",
      "notes": null
    },
    {
      "rule_type": "setback_street_side",
      "applies_to": ["all"],
      "value_numeric": 15,
      "value_text": null,
      "value_json": null,
      "unit": "feet",
      "condition_expression": {
        "if": {"is_corner_lot": true}
      },
      "ordinance_text": "Corner lots shall maintain a fifteen (15) foot setback on the street side.",
      "notes": null
    }
  ],
  "parsing_warnings": [
    "Accessory structure side setback for structures over 15 feet is not specified"
  ]
}
```

---

## Template 2: Explain Evaluation Results

### Purpose
Generate plain-English explanations of deterministic rule check results.

### System Prompt

```
You are a zoning compliance assistant. Your job is to explain rule evaluation results in clear, professional language.

RULES:
1. You may ONLY explain the provided evaluation results.
2. You may NOT add, infer, or invent any rules or facts.
3. Always cite the specific ordinance section for each rule.
4. Use simple language a homeowner would understand.
5. Be precise about numbers and measurements.
6. If something failed, explain clearly what the issue is and by how much.
7. If something is a warning, explain what is uncertain and what verification is needed.
8. Do NOT provide legal advice. Recommend consulting professionals when appropriate.

OUTPUT FORMAT:
Respond with a structured explanation that includes:
1. Overall status summary (1-2 sentences)
2. Passing checks (brief list)
3. Issues requiring attention (detailed for each)
4. Missing information / verification needed
5. Recommended next steps
```

### User Prompt Template

```
Explain the following zoning evaluation results for the property owner.

PROPERTY: {{address}}
ZONING DISTRICT: {{district_code}} - {{district_name}}
JURISDICTION: {{jurisdiction_name}}

EVALUATION RESULTS:
{{validation_result_json}}

Provide a clear, professional explanation of what these results mean.
```

### Example Output

```
## Zoning Compliance Summary

Your proposed project at **12103 202nd St SE, Snohomish, WA** has been evaluated against the R-7200 zoning district requirements. **One issue requires attention before proceeding.**

### ✓ Passing Requirements

- **Front setback**: Your structure is 28.5 feet from the front property line, exceeding the 25-foot minimum required by SCC 30.23.040(1)(a).
- **Lot coverage**: Total building coverage is 22.3%, well under the 35% maximum allowed by SCC 30.23.060(1).
- **Septic clearance**: The proposed structure is 15 feet from the drainfield, meeting the 10-foot minimum per WAC 246-272A-0210.

### ⚠ Issue Requiring Attention

- **Building height**: Your proposed structure is **38 feet tall**, which exceeds the **35-foot maximum** allowed in this zone by 3 feet (SCC 30.23.050). 
  
  **Options to resolve:**
  1. Reduce the building height by at least 3 feet
  2. Apply for a height variance through the county
  3. Consult with an architect about design modifications

### ❓ Verification Needed

- **Side setback**: We could not verify the side setback measurement because the parcel geometry does not clearly indicate the side property lines. A survey may be needed to confirm compliance with the 10-foot side setback requirement (SCC 30.23.040(1)(b)).

- **Soil perc test**: Septic drainfield sizing is estimated based on regional soil data. A site-specific perc test is required before final septic system design.

### Recommended Next Steps

1. **Address the height issue** before submitting plans
2. **Order a boundary survey** if you don't have one
3. **Schedule a perc test** with a licensed installer
4. **Contact Snohomish County Planning** for pre-application consultation

*This analysis is informational and does not constitute a permit or legal approval. Final determinations are made by the local jurisdiction.*
```

---

## Template 3: Placement Recommendation

### Purpose
Suggest where a structure can be placed within the buildable area.

### System Prompt

```
You are a site planning assistant. Your job is to recommend structure placement based on ALREADY COMPUTED buildable areas and constraints.

RULES:
1. You may ONLY recommend placement within the provided buildable_area_polygon.
2. You may NOT ignore or override any restricted areas.
3. Consider practical factors: access, orientation, existing structures.
4. Provide coordinates or relative positioning when possible.
5. Explain the reasoning for your recommendation.
6. If the buildable area is insufficient, say so clearly.
7. Do NOT guarantee compliance - recommend verification with professionals.

Your recommendations should maximize usable space while maintaining required clearances.
```

### User Prompt Template

```
Recommend optimal placement for the following structure.

PARCEL:
- Address: {{address}}
- Total area: {{lot_area_sqft}} sq ft
- Dimensions: {{lot_width}} x {{lot_depth}} feet

STRUCTURE TO PLACE:
- Type: {{structure_type}}
- Footprint: {{footprint_sqft}} sq ft
- Dimensions: {{structure_width}} x {{structure_depth}} feet
- Height: {{structure_height}} feet

BUILDABLE AREA (computed from setbacks):
{{buildable_area_geojson}}

RESTRICTED AREAS:
{{restricted_areas_json}}

EXISTING STRUCTURES:
{{existing_structures_json}}

CONSTRAINTS:
- Front setback: {{front_setback}} feet
- Side setbacks: {{side_setback}} feet
- Rear setback: {{rear_setback}} feet
- Separation from primary dwelling (if accessory): {{structure_separation}} feet
- Septic drainfield location: {{drainfield_location}}

Recommend the optimal placement location and explain your reasoning.
```

### Example Output

```
## Recommended ADU Placement

Based on the buildable area analysis, here is the recommended placement for your 800 sq ft ADU:

### Recommended Location

**Position**: Rear-left corner of the buildable envelope

**Coordinates** (approximate):
- Northwest corner: 47.9130°, -122.0985°
- Distance from rear property line: 15 feet (5 feet inside the 10-foot setback)
- Distance from left side property line: 12 feet (2 feet inside the 10-foot setback)
- Distance from primary dwelling: 18 feet (exceeds 10-foot requirement)

### Reasoning

1. **Maximizes separation from primary dwelling** while staying within buildable area
2. **Avoids septic drainfield** (located in the right-rear quadrant)
3. **Preserves front yard** for primary access and aesthetics
4. **Allows driveway access** along the right side to a potential garage door
5. **Orients naturally** for southern light exposure

### Important Clearances Maintained

| Requirement | Minimum | Achieved |
|------------|---------|----------|
| Rear setback | 5 ft | 15 ft ✓ |
| Side setback | 5 ft | 12 ft ✓ |
| From primary dwelling | 10 ft | 18 ft ✓ |
| From drainfield | 10 ft | 45 ft ✓ |
| From reserve area | 10 ft | 35 ft ✓ |

### Alternative Option

If southern orientation is not a priority, the ADU could be placed in the **rear-right corner**, which would provide:
- Closer proximity to the primary dwelling (for utility connections)
- Direct sight line from the main house
- But would require careful positioning around the reserve drainfield area

### Verification Needed

- Confirm exact property line locations with survey
- Verify utility connection routes with contractor
- Check with county for any additional overlay requirements

*This recommendation is based on computed geometry and does not guarantee permit approval.*
```

---

## Template 4: Answer User Questions

### Purpose
Answer natural language questions using ONLY provided context and citations.

### System Prompt

```
You are a zoning information assistant. You answer questions about a specific property using ONLY the provided data.

ABSOLUTE RULES:
1. ONLY use information from the provided context. Do NOT use general knowledge.
2. If the answer is not in the context, say "I don't have that information" and explain what data would be needed.
3. ALWAYS cite the source for every factual claim.
4. NEVER invent rules, zoning codes, or requirements.
5. Use clear, simple language.
6. If something is uncertain, say so explicitly.
7. Recommend verification with local authorities when appropriate.

RESPONSE FORMAT:
1. Direct answer (1-2 sentences)
2. Explanation (why this is the case)
3. Citations (specific sources)
4. Caveats or verification needed
5. Suggested next steps (if applicable)
```

### User Prompt Template

```
Answer the following question about this property.

QUESTION: {{user_question}}

---PROPERTY CONTEXT---
Address: {{address}}
Zoning District: {{district_code}} - {{district_name}}
Jurisdiction: {{jurisdiction_name}}
Lot Size: {{lot_area_sqft}} sq ft

APPLICABLE RULES:
{{rules_json}}

CURRENT EVALUATION:
{{validation_result_json}}

ENVIRONMENTAL DATA:
{{environmental_context}}

WASTEWATER DATA:
{{wastewater_context}}

---END CONTEXT---

Answer the question using ONLY the provided context. Cite sources for all claims.
```

### Example Question/Answer

**Question**: "Can I build an ADU on this property?"

**Response**:

```
## Can I build an ADU?

**Answer**: **Likely yes**, but with conditions.

### Explanation

Based on the zoning rules for the R-7200 district in Snohomish County:

1. **ADUs are permitted** on lots with a single-family dwelling, per SCC 30.23.110
2. **Your lot qualifies** at 14,500 sq ft (minimum 7,500 sq ft required)
3. **Maximum ADU size**: 1,000 sq ft or 50% of the primary dwelling, whichever is less (SCC 30.23.110(3))
4. **Setback requirements**: 5 feet from side and rear property lines (SCC 30.23.040(3))

### Wastewater Consideration

Your property is **not within the sewer service area** (verified against Snohomish County sewer district boundaries). This means:

- Septic system would serve the ADU
- County health department approval required
- Septic system must be sized for additional bedrooms
- Based on soil data, septic appears feasible but **perc test required** (WAC 246-272A-0230)

### Citations

| Claim | Source |
|-------|--------|
| ADU permitted | SCC 30.23.110 |
| Lot size requirement | SCC 30.23.110(1) |
| Size limits | SCC 30.23.110(3) |
| Setbacks | SCC 30.23.040(3) |
| Septic requirements | WAC 246-272A |

### Verification Needed

- ☐ Confirm sewer availability with county (service area boundaries may have changed)
- ☐ Schedule perc test for septic sizing
- ☐ Check for any overlay zones not in our data
- ☐ Pre-application meeting with county planning recommended

### Next Steps

1. Use our structure placement tool to find the optimal ADU location
2. Contact Snohomish County Health District for septic pre-review
3. Schedule a pre-application meeting with County Planning

*This is informational guidance based on available data. Final approval is determined by the local jurisdiction.*
```

---

## Template 5: Summarize Wastewater Constraints

### Purpose
Explain sewer vs septic determination and requirements.

### System Prompt

```
You are a wastewater systems advisor. You explain sewer and septic requirements based on ONLY the provided data.

RULES:
1. Clearly state whether the property is in a sewer service area or requires septic.
2. If sewer is available, explain connection requirements.
3. If septic is required, explain feasibility based on provided soil/lot data.
4. ALWAYS cite the regulation source.
5. List specific next steps for the property owner.
6. If data is missing, clearly state what verification is needed.
```

### Example Output

```
## Wastewater Assessment

### Determination: **Septic System Required**

Your property at 12103 202nd St SE is **outside the public sewer service area**. A private on-site septic system (OSS) is required for wastewater treatment.

### Feasibility: **Conditionally Suitable**

Based on available data:

| Factor | Value | Assessment |
|--------|-------|------------|
| Lot size | 14,500 sq ft | ✓ Exceeds 12,500 sq ft minimum |
| Soil type | Alderwood series | ⚠ Moderate limitations |
| Drainage class | Moderately well drained | ✓ Acceptable |
| Slope | 5-8% | ✓ Acceptable |
| Depth to water table | 24-36 inches | ⚠ Borderline - verify seasonally |
| Depth to restrictive layer | 40-60 inches | ✓ Acceptable |

### Septic System Sizing (Estimated)

For a 3-bedroom home + 1-bedroom ADU (4 bedrooms total):

- **Estimated daily flow**: 480 gallons/day (120 gpd × 4 bedrooms)
- **Drainfield size needed**: ~900-1,200 sq ft (depends on perc rate)
- **Reserve area required**: 100% of primary drainfield
- **Total septic area needed**: ~2,000-2,500 sq ft

### Required Setbacks

| From | Distance Required | Source |
|------|------------------|--------|
| Building foundation | 10 feet | WAC 246-272A-0210 |
| Property line | 5 feet | WAC 246-272A-0210 |
| Well (if any) | 100 feet | WAC 246-272A-0210 |
| Water bodies | 100 feet | WAC 246-272A-0210 |

### Next Steps (Required)

1. **Hire a licensed designer** to conduct site evaluation
2. **Perc test required** - this is mandatory, not optional
3. **Apply to Snohomish Health District** for OSS permit
4. **Reserve drainfield area** must be identified and protected

### Important Notes

- Alderwood soils have a shallow restrictive layer; may require pressure distribution system
- Verify seasonal high water table during wet season (Nov-Mar)
- ADU will require septic expansion OR demonstration of existing capacity

*Source: USDA SSURGO soil data, WAC 246-272A (On-Site Sewage Systems), Snohomish Health District requirements*
```



