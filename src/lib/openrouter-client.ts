/**
 * OpenRouter API client using OpenAI-compatible format
 * OpenRouter accepts the OpenAI API format, not Anthropic format
 */

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface CreateMessageParams {
  model: string;
  max_tokens: number;
  messages: Message[];
  system?: string;
  temperature?: number;
}

interface ChatCompletionResponse {
  choices: Array<{ message: { content: string } }>;
  error?: { message: string };
}

export const createOpenRouterMessage = async (
  params: CreateMessageParams
): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  if (typeof apiKey !== 'string') {
    throw new Error(`ANTHROPIC_API_KEY is not a string, got: ${typeof apiKey}`);
  }

  if (!apiKey.startsWith('sk-or-v1-')) {
    console.warn(`[OpenRouter] Warning: API key doesn't start with sk-or-v1- prefix, got: ${apiKey.substring(0, 20)}...`);
  }

  // Build messages array - add system message if provided
  const messages: Message[] = [];

  if (params.system) {
    messages.push({
      role: "system",
      content: params.system,
    });
  }

  messages.push(...params.messages);

  console.log(
    `[OpenRouter] Calling with model: ${params.model}, messages: ${messages.length}`
  );

  const requestBody = {
    model: params.model,
    max_tokens: params.max_tokens,
    messages: messages,
    temperature: params.temperature ?? 0.7,
  };

  console.log(`[OpenRouter] API Key format: ${apiKey.substring(0, 10)}...`);
  console.log(`[OpenRouter] Request body:`, JSON.stringify(requestBody, null, 2));

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:3000",
      "X-OpenRouter-Title": "Vertex",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();

  if (!response.ok) {
    console.error(`[OpenRouter] API Error - Status: ${response.status}`);
    console.error(`[OpenRouter] Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.error(`[OpenRouter] Response Body: ${responseText}`);

    try {
      const errorData = JSON.parse(responseText);
      if (errorData.error) {
        throw new Error(
          `OpenRouter API error (${response.status}): ${errorData.error.message || JSON.stringify(errorData.error)}`
        );
      }
    } catch (e) {
      // If we can't parse JSON, just throw the status error
      if (e instanceof Error && e.message.includes("OpenRouter")) {
        throw e;
      }
    }

    throw new Error(`OpenRouter API error: ${response.status} - ${responseText}`);
  }

  let data: ChatCompletionResponse;
  try {
    data = JSON.parse(responseText) as ChatCompletionResponse;
  } catch (e) {
    console.error(`[OpenRouter] Failed to parse response: ${responseText}`);
    throw new Error(`Failed to parse OpenRouter response: ${responseText}`);
  }

  if (data.error) {
    throw new Error(`OpenRouter error: ${data.error.message}`);
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error(`[OpenRouter] Invalid response structure:`, data);
    throw new Error("Invalid response from OpenRouter");
  }

  console.log(`[OpenRouter] Success - response length: ${data.choices[0].message.content.length}`);
  return data.choices[0].message.content;
};

