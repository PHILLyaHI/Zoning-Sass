import { NextRequest, NextResponse } from "next/server";
import { 
  askPropertyQuestion, 
  getSuggestedQuestions,
  type PropertyContext,
  type AIMessage 
} from "../../../../lib/openai";

// ============================================
// AI CHAT API ROUTE
// ============================================
// OpenAI-powered Q&A about zoning and property

export type ChatRequest = {
  message: string;
  propertyContext?: PropertyContext;
  conversationHistory?: AIMessage[];
};

export type ChatResponse = {
  message: string;
  suggestedQuestions?: string[];
  citations?: string[];
  error?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChatRequest;
    const { message, propertyContext, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return helpful fallback response
      const fallbackResponse = getFallbackResponse(message, propertyContext);
      return NextResponse.json({
        success: true,
        data: fallbackResponse,
      });
    }

    // Use OpenAI for real response
    const context = propertyContext || getDefaultContext();
    const result = await askPropertyQuestion(message, context, conversationHistory || []);

    if (!result.success) {
      return NextResponse.json({
        success: true, // Still return success to client
        data: {
          message: result.message || "I couldn't process your question. Please try again.",
          suggestedQuestions: getSuggestedQuestions(context),
          error: result.error,
        } as ChatResponse,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        suggestedQuestions: getSuggestedQuestions(context),
        citations: result.citations,
      } as ChatResponse,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Chat service error",
        data: {
          message: "I'm having trouble processing your request. Please try again.",
          suggestedQuestions: [
            "What can I build on my property?",
            "How do setbacks work?",
            "Do I need a permit?",
          ],
        }
      },
      { status: 500 }
    );
  }
}

// ============================================
// FALLBACK RESPONSES (when OpenAI not configured)
// ============================================

function getDefaultContext(): PropertyContext {
  return {
    address: "Property Address",
    city: "Snohomish",
    state: "WA",
    zoningDistrict: "Rural Residential",
    zoningCode: "R-5",
  };
}

function getFallbackResponse(message: string, context?: PropertyContext): ChatResponse {
  const query = message.toLowerCase();
  
  // Match common questions
  if (query.includes("adu") || query.includes("accessory dwelling")) {
    return {
      message: `Based on your property in the ${context?.zoningDistrict || "R-5"} zone:

**ADU (Accessory Dwelling Unit) Summary:**

✅ **Permitted:** One ADU is generally allowed per lot in Snohomish County residential zones.

**Requirements:**
• Maximum size: 1,000 sq ft or 50% of primary dwelling (whichever is less)
• Must meet standard setbacks (typically 10ft side/rear for accessory structures)
• Requires building permit and possibly septic review

**Next Steps:**
1. Verify lot meets minimum size requirements
2. Check septic capacity (may need upgrade for additional bedrooms)
3. Apply for pre-application meeting with Planning

*Note: This is general guidance. Please verify with Snohomish County Planning.*`,
      suggestedQuestions: [
        "What are the setback requirements for an ADU?",
        "How does septic work with an ADU?",
        "What permits do I need?",
      ],
    };
  }

  if (query.includes("setback")) {
    const front = context?.zoningCode?.includes("R-5") ? "35" : "25";
    const side = context?.zoningCode?.includes("R-5") ? "15" : "10";
    
    return {
      message: `**Setback Requirements for ${context?.zoningCode || "Residential"} Zone:**

| Setback Type | Primary Structure | Accessory Structure |
|-------------|-------------------|---------------------|
| Front       | ${front} ft       | ${front} ft         |
| Side        | ${side} ft        | 10 ft              |
| Rear        | 25 ft             | 10 ft              |

**Important Notes:**
• Setbacks are measured from property lines to building walls
• Eaves can typically extend up to 2 ft into setbacks
• Corner lots may have additional street-side requirements
• Variances possible but require justification

*Per SCC 30.23.040 - verify current code for your specific zone.*`,
      suggestedQuestions: [
        "Can I get a setback variance?",
        "How are corner lot setbacks calculated?",
        "What about septic setbacks?",
      ],
    };
  }

  if (query.includes("septic") || query.includes("sewer")) {
    return {
      message: `**Septic System Information:**

${context?.lotSizeSqft && context.lotSizeSqft > 43560 
  ? "Your lot size appears sufficient for on-site septic." 
  : "Septic requirements depend on lot size and soil conditions."}

**Key Setback Requirements:**
• Septic tank: 10 ft from buildings, 5 ft from property lines
• Drainfield: 20 ft from buildings, 10 ft from property lines  
• From wells: 100 ft minimum

**Required for New System:**
1. Site evaluation by licensed designer
2. Soil analysis / perc test
3. Health department permit
4. As-built inspection

**Estimated Costs:**
• Conventional system: $15,000 - $25,000
• Alternative system: $25,000 - $40,000+

*Per WAC 246-272A. Consult licensed septic designer.*`,
      suggestedQuestions: [
        "Can I expand my septic for an ADU?",
        "What soil types work for septic?",
        "Who do I contact for a perc test?",
      ],
    };
  }

  if (query.includes("permit") || query.includes("build")) {
    return {
      message: `**Building Permit Requirements:**

**Permits Typically Required:**
• 🏗️ Building Permit - for any structure over 200 sq ft
• 🔌 Electrical Permit - for any electrical work
• 🚰 Plumbing Permit - if connecting water/sewer
• 🌿 Grading Permit - for significant earthwork
• 🦺 SEPA Review - for larger projects

**Application Process:**
1. Pre-application meeting (recommended)
2. Submit site plan and building plans
3. Plan review (4-8 weeks typical)
4. Pay fees and receive permits
5. Schedule inspections during construction

**Estimated Fees:**
• Building permit: ~$2,000 - $5,000 for typical ADU
• Plan review: ~$500 - $1,500
• Impact fees: vary by area

*Contact: Snohomish County PDS at (425) 388-3311*`,
      suggestedQuestions: [
        "How long does permit review take?",
        "What drawings do I need?",
        "Can I do owner-builder?",
      ],
    };
  }

  // Default response
  return {
    message: `I can help you understand zoning and building requirements for your property${context?.address ? ` at ${context.address}` : ""}.

**I can answer questions about:**
• 🏠 ADU/DADU feasibility and requirements
• 📏 Setback and height requirements  
• 💧 Septic system feasibility
• 📋 Permit requirements and process
• 🗺️ Zoning rules and restrictions

**Your Property:**
• Zone: ${context?.zoningDistrict || "Residential"} (${context?.zoningCode || "R-5"})
• Location: ${context?.city || "Snohomish"}, ${context?.state || "WA"}
${context?.lotSizeSqft ? `• Lot Size: ${(context.lotSizeSqft / 43560).toFixed(2)} acres` : ""}

What would you like to know?`,
    suggestedQuestions: getSuggestedQuestions(context || getDefaultContext()),
  };
}



