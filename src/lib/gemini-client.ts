/**
 * Google Gemini API client
 * Free tier with no credit limits
 */

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

  console.log(`[Gemini] Calling with model: gemini-2.0-flash, messages: ${params.messages.length}`);

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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
        throw new Error(
          `Gemini API error (${response.status}): ${errorData.error.message || JSON.stringify(errorData.error)}`
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
