// ============================================
// AI-POWERED RULE EXTRACTION
// ============================================
// Uses OpenAI to parse regulation documents and
// extract structured rules for our database
//
// This enables scaling to all US counties by
// processing their PDF/HTML regulations

import type { HealthRule, RuleCategory, RuleLevel } from "./nationalRules";

// ============================================
// TYPES
// ============================================

export type ExtractionSource = {
  sourceType: "pdf" | "html" | "text";
  sourceUrl?: string;
  sourceName: string;
  stateCode: string;
  countyName?: string;
  content: string;  // Raw text content
};

export type ExtractionResult = {
  success: boolean;
  rules: HealthRule[];
  confidence: number;
  warnings: string[];
  rawResponse?: string;
};

// ============================================
// EXTRACTION PROMPT
// ============================================

const EXTRACTION_SYSTEM_PROMPT = `You are a legal document parser specializing in US building codes, health regulations, and septic/wastewater requirements.

Your task is to extract STRUCTURED RULES from regulatory documents. Each rule should be a specific, measurable requirement.

OUTPUT FORMAT (JSON array):
[
  {
    "category": "septic_setbacks" | "septic_general" | "septic_soil" | "septic_sizing" | "well_setbacks" | "wetland_buffer" | "flood_zone" | "health_permit" | "perc_test",
    "title": "Short descriptive title",
    "description": "Full description of the requirement",
    "valueNumeric": 50,  // Number if applicable
    "unit": "feet" | "percent" | "gallons" | "acres" | "inches",
    "conditions": {
      "minLotSize": 21780,  // in sq ft if applicable
      "systemType": ["conventional_gravity"],  // if rule is system-specific
      "newConstruction": true  // if only applies to new construction
    },
    "citation": {
      "code": "WAC 246-272A-0210",
      "section": "Table II"
    }
  }
]

EXTRACTION RULES:
1. Only extract SPECIFIC, MEASURABLE requirements (numbers, distances, percentages)
2. Skip general guidance or recommendations
3. Include the exact code citation if visible
4. If a rule has conditions (lot size, system type), include them
5. Keep descriptions concise but complete
6. If unsure about a value, skip that rule

COMMON CATEGORIES:
- septic_setbacks: Distances from septic to buildings, property lines, etc.
- well_setbacks: Distances from septic/drainfield to wells
- septic_sizing: Tank/drainfield sizing requirements
- septic_soil: Soil suitability requirements
- perc_test: Percolation test requirements
- health_permit: Permit requirements
- wetland_buffer: Wetland setback requirements`;

// ============================================
// EXTRACTION FUNCTION
// ============================================

export async function extractRulesFromText(
  source: ExtractionSource
): Promise<ExtractionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      rules: [],
      confidence: 0,
      warnings: ["OpenAI API key not configured"],
    };
  }

  // Truncate content if too long (GPT-4 context limit)
  const maxChars = 12000;
  const content = source.content.length > maxChars 
    ? source.content.substring(0, maxChars) + "\n\n[Content truncated...]"
    : source.content;

  const userPrompt = `Extract all septic, health, and setback rules from this ${source.stateCode}${source.countyName ? ` ${source.countyName} County` : ""} regulation document.

SOURCE: ${source.sourceName}

DOCUMENT TEXT:
${content}

Extract all specific requirements as JSON. Only include rules with clear numeric values or specific requirements.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,  // Low temperature for consistent extraction
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return {
        success: false,
        rules: [],
        confidence: 0,
        warnings: ["Could not parse JSON from response"],
        rawResponse: rawContent,
      };
    }

    const parsedRules = JSON.parse(jsonMatch[0]);
    
    // Convert to our HealthRule format
    const rules: HealthRule[] = parsedRules.map((r: any, index: number) => ({
      id: `extracted-${source.stateCode.toLowerCase()}-${source.countyName?.toLowerCase().replace(/\s/g, "-") || "state"}-${index}`,
      level: source.countyName ? "county" as RuleLevel : "state" as RuleLevel,
      stateCode: source.stateCode,
      countyFips: undefined,  // Would need to look up
      category: r.category as RuleCategory,
      title: r.title,
      description: r.description,
      valueNumeric: r.valueNumeric,
      valueText: r.valueText,
      unit: r.unit,
      conditions: r.conditions,
      citation: {
        source: source.sourceName,
        code: r.citation?.code || "",
        section: r.citation?.section,
        url: source.sourceUrl,
        lastVerified: new Date().toISOString().split("T")[0],
      },
      isActive: true,
    }));

    return {
      success: true,
      rules,
      confidence: rules.length > 0 ? 0.8 : 0.3,
      warnings: rules.length === 0 ? ["No rules extracted from document"] : [],
      rawResponse: rawContent,
    };
  } catch (error) {
    console.error("Rule extraction error:", error);
    return {
      success: false,
      rules: [],
      confidence: 0,
      warnings: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

// ============================================
// BATCH EXTRACTION FOR MULTIPLE STATES
// ============================================

export async function extractRulesFromMultipleSources(
  sources: ExtractionSource[]
): Promise<Map<string, ExtractionResult>> {
  const results = new Map<string, ExtractionResult>();
  
  // Process sequentially to avoid rate limits
  for (const source of sources) {
    const key = `${source.stateCode}-${source.countyName || "state"}`;
    console.log(`Extracting rules from: ${key}`);
    
    const result = await extractRulesFromText(source);
    results.set(key, result);
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

// ============================================
// SAMPLE TEXT FOR TESTING
// ============================================

export const SAMPLE_WA_REGULATION_TEXT = `
WAC 246-272A-0210 Minimum setbacks

(1) The local health officer may increase setbacks as site conditions warrant.

(2) Minimum horizontal setbacks for OSS components measured from:

Table II
Minimum Horizontal Setbacks

To property lines:
- Septic tank: 5 feet
- Drainfield/STA: 5 feet

To buildings:
- Septic tank: 5 feet
- Drainfield/STA: 10 feet

To water supply wells:
- Septic tank: 100 feet
- Drainfield/STA: 100 feet

To surface water (streams, lakes):
- Septic tank: 100 feet
- Drainfield/STA: 100 feet

To cuts, fills, or slopes >30%:
- Drainfield: 30 feet

(3) A one hundred percent reserve drainfield area (equal in size to the primary 
drainfield) must be provided and protected for future use.

(4) The reserve area must meet the same soil and site requirements as the primary area.
`;

// ============================================
// TEST FUNCTION
// ============================================

export async function testExtraction(): Promise<ExtractionResult> {
  const testSource: ExtractionSource = {
    sourceType: "text",
    sourceName: "WAC 246-272A-0210",
    stateCode: "WA",
    content: SAMPLE_WA_REGULATION_TEXT,
  };
  
  return extractRulesFromText(testSource);
}



