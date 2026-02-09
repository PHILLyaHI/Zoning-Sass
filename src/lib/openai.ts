// ============================================
// OPENAI INTEGRATION
// ============================================
// AI-powered explanations and Q&A
// NOTE: OpenAI is NEVER the source of truth for rules
// It only explains and structures deterministic data

import { PropertyRecord, ValidationCheck, ZoningRule } from "./types";

// ============================================
// TYPES
// ============================================

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AIResponse = {
  success: boolean;
  message: string;
  citations?: string[];
  suggestedActions?: string[];
  error?: string;
};

export type PropertyContext = {
  address: string;
  city: string;
  state: string;
  lotSizeSqft?: number;
  zoningDistrict?: string;
  zoningCode?: string;
  validationIssues?: string[];
  soilType?: string;
  septicInfo?: string;
  utilities?: string[];
};

// ============================================
// OPENAI CLIENT
// ============================================

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(
  messages: AIMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn("OpenAI API key not configured - using fallback responses");
    return {
      success: false,
      message: "AI features are not configured. Please add your OpenAI API key.",
      error: "OPENAI_API_KEY not set",
    };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Cost-effective and fast
        messages,
        temperature: options.temperature ?? 0.3, // Lower = more deterministic
        max_tokens: options.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return {
      success: true,
      message: content,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return {
      success: false,
      message: "Sorry, I couldn't process your request. Please try again.",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ============================================
// SYSTEM PROMPTS
// ============================================

const SYSTEM_PROMPT_BASE = `You are a helpful zoning and land use assistant for a property analysis platform. Your role is to:

1. EXPLAIN zoning rules and regulations in plain English
2. HELP users understand what they can build on their property
3. CLARIFY validation results and what they mean
4. SUGGEST next steps for their project

IMPORTANT RULES:
- You are NOT the source of truth for zoning rules. You explain rules that come from official sources.
- Always cite the source when explaining rules (e.g., "According to Snohomish County Code...")
- If uncertain, recommend the user verify with their local planning department
- Be concise but thorough
- Use bullet points for clarity
- Be encouraging but realistic about challenges`;

const SYSTEM_PROMPT_PROPERTY = (context: PropertyContext) => `${SYSTEM_PROMPT_BASE}

CURRENT PROPERTY CONTEXT:
- Address: ${context.address}
- Location: ${context.city}, ${context.state}
- Lot Size: ${context.lotSizeSqft ? `${(context.lotSizeSqft / 43560).toFixed(2)} acres (${context.lotSizeSqft.toLocaleString()} sq ft)` : "Unknown"}
- Zoning: ${context.zoningDistrict || "Unknown"} (${context.zoningCode || "N/A"})
${context.soilType ? `- Soil Type: ${context.soilType}` : ""}
${context.septicInfo ? `- Septic: ${context.septicInfo}` : ""}
${context.utilities?.length ? `- Utilities: ${context.utilities.join(", ")}` : ""}
${context.validationIssues?.length ? `\nCURRENT ISSUES:\n${context.validationIssues.map(i => `- ${i}`).join("\n")}` : ""}

When answering questions, use this context to provide specific, relevant answers.`;

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * General Q&A about property/zoning
 */
export async function askPropertyQuestion(
  question: string,
  context: PropertyContext,
  conversationHistory: AIMessage[] = []
): Promise<AIResponse> {
  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_PROPERTY(context) },
    ...conversationHistory,
    { role: "user", content: question },
  ];

  return callOpenAI(messages);
}

/**
 * Explain a validation result
 */
export async function explainValidation(
  check: ValidationCheck,
  context: PropertyContext
): Promise<AIResponse> {
  const prompt = `Please explain this zoning validation result in plain English:

Rule Type: ${check.ruleType}
Status: ${check.status.toUpperCase()}
Measured Value: ${check.measuredValue} ${check.unit || ""}
Required Value: ${check.requiredValue} ${check.unit || ""}
${check.reason ? `Reason: ${check.reason}` : ""}
${check.citations?.length ? `Citation: ${check.citations.map(c => c.section).join(", ")}` : ""}

Explain:
1. What this rule means
2. Why it passed/failed
3. What the property owner should do (if it failed)`;

  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_PROPERTY(context) },
    { role: "user", content: prompt },
  ];

  return callOpenAI(messages, { temperature: 0.2 });
}

/**
 * Get ADU feasibility explanation
 */
export async function explainADUFeasibility(
  context: PropertyContext,
  hasExistingSeptic: boolean,
  hasWell: boolean
): Promise<AIResponse> {
  const prompt = `Based on this property, explain the feasibility of building an ADU (Accessory Dwelling Unit):

Property Details:
- Lot Size: ${context.lotSizeSqft ? `${context.lotSizeSqft.toLocaleString()} sq ft` : "Unknown"}
- Zoning: ${context.zoningDistrict || "Unknown"}
- Has Existing Septic: ${hasExistingSeptic ? "Yes" : "No"}
- Has Well: ${hasWell ? "Yes" : "No"}
- Soil Type: ${context.soilType || "Unknown"}

Please explain:
1. Is an ADU likely permitted in this zone?
2. What are the key requirements?
3. What challenges might the owner face?
4. What permits would be needed?
5. Rough cost estimate range`;

  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_PROPERTY(context) },
    { role: "user", content: prompt },
  ];

  return callOpenAI(messages);
}

/**
 * Explain septic requirements
 */
export async function explainSepticRequirements(
  context: PropertyContext,
  soilSuitability: string,
  hasExistingSystem: boolean
): Promise<AIResponse> {
  const prompt = `Explain the septic system situation for this property:

Property Details:
- Location: ${context.city}, ${context.state}
- Lot Size: ${context.lotSizeSqft ? `${context.lotSizeSqft.toLocaleString()} sq ft` : "Unknown"}
- Soil Suitability: ${soilSuitability}
- Has Existing Septic: ${hasExistingSystem ? "Yes" : "No"}
- Soil Type: ${context.soilType || "Unknown"}

Please explain:
1. What type of septic system would be appropriate?
2. What are the key setback requirements?
3. Can the existing system (if any) handle additional bedrooms?
4. What permits and tests are required?
5. Estimated cost range for a new system`;

  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_PROPERTY(context) },
    { role: "user", content: prompt },
  ];

  return callOpenAI(messages);
}

/**
 * Suggest optimal structure placement
 */
export async function suggestPlacement(
  context: PropertyContext,
  structureType: string,
  constraints: string[]
): Promise<AIResponse> {
  const prompt = `Suggest the optimal placement for a ${structureType} on this property:

Property Details:
- Lot Size: ${context.lotSizeSqft ? `${context.lotSizeSqft.toLocaleString()} sq ft` : "Unknown"}
- Zoning: ${context.zoningDistrict || "Unknown"}

Current Constraints:
${constraints.map(c => `- ${c}`).join("\n")}

Please suggest:
1. Best location on the lot (considering setbacks)
2. Recommended orientation
3. Size limitations
4. Any special considerations`;

  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_PROPERTY(context) },
    { role: "user", content: prompt },
  ];

  return callOpenAI(messages);
}

/**
 * Generate plain-English summary of property feasibility
 */
export async function generateFeasibilitySummary(
  context: PropertyContext,
  checks: { passed: number; warnings: number; failed: number }
): Promise<AIResponse> {
  const prompt = `Generate a brief, encouraging summary of this property's development potential:

Property: ${context.address}
Zoning: ${context.zoningDistrict || "Unknown"}
Lot Size: ${context.lotSizeSqft ? `${(context.lotSizeSqft / 43560).toFixed(2)} acres` : "Unknown"}

Validation Results:
- Passing Checks: ${checks.passed}
- Warnings: ${checks.warnings}
- Failed Checks: ${checks.failed}

Current Issues: ${context.validationIssues?.join("; ") || "None identified"}

Write a 2-3 sentence summary that:
1. Highlights the property's potential
2. Notes any key challenges
3. Suggests a logical next step`;

  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT_PROPERTY(context) },
    { role: "user", content: prompt },
  ];

  return callOpenAI(messages, { temperature: 0.4, maxTokens: 300 });
}

// ============================================
// SUGGESTED QUESTIONS
// ============================================

export function getSuggestedQuestions(context: PropertyContext): string[] {
  const questions = [
    "Can I build an ADU on this property?",
    "What are the setback requirements?",
    "How do I get a building permit?",
  ];

  if (context.zoningDistrict?.toLowerCase().includes("rural") || 
      (context.lotSizeSqft && context.lotSizeSqft > 20000)) {
    questions.push("What are my septic options?");
    questions.push("Can I subdivide this lot?");
  }

  if (context.validationIssues?.length) {
    questions.push("How do I resolve the current violations?");
  }

  return questions.slice(0, 5);
}



