// ============================================
// AI SERVICE — Client-side chat interface
// ============================================
// Connects to /api/ai/chat for OpenAI responses
// Falls back to helpful responses if API not configured

import { PropertyRecord, Citation } from "./types";

// ============================================
// TYPES
// ============================================

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  suggestedQuestions?: string[];
};

type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type PropertyContext = {
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
// MAIN CHAT FUNCTION
// ============================================

export async function chat(
  property: PropertyRecord,
  userMessage: string,
  previousMessages: ChatMessage[]
): Promise<ChatMessage> {
  // Build context from property
  const context: PropertyContext = {
    address: property.address,
    city: property.city,
    state: property.state,
    lotSizeSqft: property.areaSqft,
    zoningDistrict: property.zoningDistrict?.name,
    zoningCode: property.zoningDistrict?.code,
    validationIssues: property.feasibility?.items
      .filter(i => i.status === "fail" || i.status === "warn")
      .map(i => i.summary),
  };

  // Convert previous messages to API format
  const conversationHistory: AIMessage[] = previousMessages.map(msg => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
        propertyContext: context,
        conversationHistory,
      }),
    });

    const result = await response.json();

    if (result.success && result.data) {
      return {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: result.data.message,
        timestamp: new Date(),
        citations: result.data.citations?.map((c: string) => ({
          source: c,
        })),
        suggestedQuestions: result.data.suggestedQuestions,
      };
    }

    throw new Error(result.error || "Chat failed");
  } catch (error) {
    console.error("AI chat error:", error);
    
    // Return a helpful fallback response
    return {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: "I'm having trouble connecting to the AI service. Please try again, or check that your OpenAI API key is configured.",
      timestamp: new Date(),
      suggestedQuestions: getSuggestedQuestions(property),
    };
  }
}

// ============================================
// SUGGESTED QUESTIONS
// ============================================

export function getSuggestedQuestions(property: PropertyRecord): string[] {
  const questions: string[] = [];

  // Always relevant
  questions.push("Can I build an ADU on this property?");
  questions.push("What are the setback requirements?");

  // Based on property characteristics
  if (property.areaSqft && property.areaSqft > 20000) {
    questions.push("Can I subdivide this lot?");
  }

  if (property.zoningDistrict?.code?.includes("R-5") || 
      property.zoningDistrict?.code?.includes("R-10") ||
      (property.areaSqft && property.areaSqft > 43560)) {
    questions.push("What are my septic options?");
    questions.push("Can I build a shop or barn?");
  }

  // Based on feasibility issues
  const hasIssues = property.feasibility?.items.some(
    i => i.status === "fail" || i.status === "warn"
  );
  if (hasIssues) {
    questions.push("How do I resolve the validation issues?");
  }

  // Always include permit question
  questions.push("What permits do I need to build?");

  // Return unique questions, limit to 5
  return [...new Set(questions)].slice(0, 5);
}

// ============================================
// EXPLANATION HELPERS
// ============================================

export async function explainFeasibilityItem(
  property: PropertyRecord,
  itemId: string
): Promise<string> {
  const item = property.feasibility?.items.find(i => i.id === itemId);
  if (!item) return "Item not found.";

  const response = await chat(
    property,
    `Explain the "${item.label}" check that shows "${item.summary}". What does this mean for my project?`,
    []
  );

  return response.content;
}

export async function getQuickAdvice(
  property: PropertyRecord,
  topic: "adu" | "septic" | "setbacks" | "permits"
): Promise<string> {
  const prompts: Record<string, string> = {
    adu: "What are the ADU requirements for this property? Can I build one?",
    septic: "What are the septic options and requirements for this property?",
    setbacks: "What are all the setback requirements I need to follow?",
    permits: "What permits will I need for a new construction project?",
  };

  const response = await chat(property, prompts[topic], []);
  return response.content;
}
