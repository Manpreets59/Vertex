import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    console.log(`[Test] API Key starts with: ${apiKey.substring(0, 20)}...`);
    console.log(`[Test] Making test request to OpenRouter...`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-OpenRouter-Title": "Vertex",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.6",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "Say 'test successful' if you can read this",
          },
        ],
      }),
    });

    console.log(`[Test] Response status: ${response.status}`);
    console.log(`[Test] Response headers:`, Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log(`[Test] Response body: ${responseText}`);

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      body: responseText,
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
