import { NextRequest, NextResponse } from "next/server";
import { 
  getRulesForLocation, 
  getSepticSetbacks, 
  getDataQuality,
  getStatesWithCoverage,
  type HealthRule 
} from "../../../lib/nationalRules";

// ============================================
// NATIONAL RULES API
// ============================================
// Returns applicable health & septic rules for a location

export type RulesResult = {
  stateCode: string;
  countyName?: string;
  rules: HealthRule[];
  septicSetbacks: {
    tankToBuilding: number;
    drainfieldToBuilding: number;
    drainfieldToProperty: number;
    toWell: number;
    source: string;
  };
  dataQuality: {
    level: "high" | "medium" | "low";
    message: string;
    recommendation: string;
  };
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const stateCode = searchParams.get("state");
  const countyName = searchParams.get("county");
  const countyFips = searchParams.get("fips");

  if (!stateCode) {
    // Return list of states with coverage
    return NextResponse.json({
      success: true,
      data: {
        states: getStatesWithCoverage(),
        message: "Provide ?state=XX to get rules for a specific state",
      },
    });
  }

  try {
    const rules = getRulesForLocation(stateCode, countyFips || undefined);
    const septicSetbacks = getSepticSetbacks(stateCode);
    const dataQuality = getDataQuality(stateCode, countyFips || undefined);

    const result: RulesResult = {
      stateCode: stateCode.toUpperCase(),
      countyName: countyName || undefined,
      rules,
      septicSetbacks,
      dataQuality,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Rules lookup error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to lookup rules" },
      { status: 500 }
    );
  }
}

// POST - Extract rules from document (requires OpenAI key)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stateCode, countyName, documentText, sourceUrl, sourceName } = body;

    if (!stateCode || !documentText) {
      return NextResponse.json(
        { success: false, error: "stateCode and documentText are required" },
        { status: 400 }
      );
    }

    // Import the extractor
    const { extractRulesFromText } = await import("../../../lib/ruleExtractor");

    const result = await extractRulesFromText({
      sourceType: "text",
      stateCode,
      countyName,
      content: documentText,
      sourceUrl,
      sourceName: sourceName || "Uploaded Document",
    });

    return NextResponse.json({
      success: result.success,
      data: {
        extractedRules: result.rules,
        confidence: result.confidence,
        warnings: result.warnings,
      },
    });
  } catch (error) {
    console.error("Rule extraction error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to extract rules" },
      { status: 500 }
    );
  }
}



