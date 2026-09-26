/**
 * Google Gemini API client
 * Free tier with no credit limits
 *
 * NOTE ON MODEL NAMES: Google deprecates and shuts down Gemini model IDs
 * fairly frequently (gemini-2.0-flash was shut down June 1, 2026). Rather
 * than hardcoding a model name, this file resolves it in order of:
 *   1. an explicit `model` passed by the caller
 *   2. the GEMINI_MODEL environment variable
 *   3. DEFAULT_MODEL below
 * When Google deprecates the current default, update DEFAULT_MODEL (or set
 * GEMINI_MODEL in your .env.local) — check https://ai.google.dev/gemini-api/docs/models
 * for the current free-tier model list before picking a replacement, since
 * not every "latest" model Google points you to is actually free.
 */

// gemini-2.5-flash is confirmed free-tier as of writing. Swap this (or set
// GEMINI_MODEL) if Google deprecates it — do not blindly follow whatever
// model name shows up in a 404 error message, some suggested replacements
// are paid-only.
const DEFAULT_MODEL = "gemini-2.5-flash";

interface Content {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface CreateMessageParams {
  model?: string;
  max_tokens: number;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  system?: string;
  temperature?: number;
}

export const createGeminiMessage = async (
  params: CreateMessageParams
): Promise<string> => {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const model = params.model || process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Build contents array
  const contents: Content[] = [];

  // Add system message as first user message if provided
  if (params.system) {
    contents.push({
      role: "user",
      parts: [{ text: params.system }],
    });
    contents.push({
      role: "model",
      parts: [{ text: "Understood. I'll follow these instructions." }],
    });
  }

  // Add conversation messages
  for (const msg of params.messages) {
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  console.log(`[Gemini] Calling with model: ${model}, messages: ${params.messages.length}`);

  const requestBody = {
    contents: contents,
    generationConfig: {
      maxOutputTokens: params.max_tokens,
      temperature: params.temperature ?? 0.7,
      topP: 0.95,
    },
  };

  console.log(`[Gemini] API Key present: ${apiKey.substring(0, 10)}...`);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`[Gemini] API Error - Status: ${response.status}`);
    console.error(`[Gemini] Response: ${responseText}`);

    try {
      const errorData = JSON.parse(responseText);
      if (errorData.error) {
        const hint = response.status === 404
          ? ` — model "${model}" may be deprecated/renamed. Check https://ai.google.dev/gemini-api/docs/models for a current free-tier model and set GEMINI_MODEL in .env.local.`
          : "";
        throw new Error(
          `Gemini API error (${response.status}): ${errorData.error.message || JSON.stringify(errorData.error)}${hint}`
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("Gemini")) {
        throw e;
      }
    }

    throw new Error(`Gemini API error: ${response.status} - ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error(`[Gemini] Failed to parse response: ${responseText}`);
    throw new Error(`Failed to parse Gemini response: ${responseText}`);
  }

  if (
    !data.candidates ||
    !data.candidates[0] ||
    !data.candidates[0].content ||
    !data.candidates[0].content.parts ||
    !data.candidates[0].content.parts[0]
  ) {
    console.error(`[Gemini] Invalid response structure:`, data);
    throw new Error("Invalid response from Gemini");
  }

  const responseContent = data.candidates[0].content.parts[0].text;
  console.log(`[Gemini] Success - response length: ${responseContent.length}`);
  return responseContent;
};