import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { createGeminiMessage } from "@/lib/gemini-client";
import { CODING_AGENT_SYSTEM_PROMPT } from "@/features/conversations/inngest/constants";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const internalKey = process.env.VERTEX_CONVEX_INTERNAL_KEY;

  if (!internalKey) {
    return NextResponse.json(
      { error: "Internal key not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { conversationId, message } = requestSchema.parse(body);

  // Get conversation
  const conversation = await convex.query(api.system.getConversationById, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const projectId = conversation.projectId;

  // Cancel all processing messages
  const processingMessages = await convex.query(
    api.system.getProcessingMessages,
    {
      internalKey,
      projectId,
    }
  );

  if (processingMessages.length > 0) {
    await Promise.all(
      processingMessages.map(async (msg) => {
        await convex.mutation(api.system.updateMessageStatus, {
          internalKey,
          messageId: msg._id,
          status: "cancelled",
        });
      })
    );
  }

  // Create user message
  await convex.mutation(api.system.createMessage, {
    internalKey,
    conversationId: conversationId as Id<"conversations">,
    projectId,
    role: "user",
    content: message,
  });

  // Create assistant message
  const assistantMessageId = await convex.mutation(
    api.system.createMessage,
    {
      internalKey,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      role: "assistant",
      content: "",
      status: "processing",
    }
  );

  try {
    // Get recent messages for context
    const recentMessages = await convex.query(api.system.getRecentMessages, {
      internalKey,
      conversationId,
      limit: 10,
    });

    // Build system prompt with conversation history
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== assistantMessageId && msg.content.trim() !== ""
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // Call Gemini directly (no Inngest)
    const assistantResponse = await createGeminiMessage({
      max_tokens: 1300,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    // Update message with response
    await convex.mutation(api.system.updateMessageContent, {
      internalKey,
      messageId: assistantMessageId,
      content: assistantResponse,
    });

    return NextResponse.json({
      success: true,
      messageId: assistantMessageId,
      response: assistantResponse,
    });
  } catch (error) {
    console.error("Error processing message:", error);

    // Update message with error
    await convex.mutation(api.system.updateMessageContent, {
      internalKey,
      messageId: assistantMessageId,
      content:
        "Sorry, I encountered an error. Please try again. " +
        (error instanceof Error ? `(${error.message})` : ""),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        messageId: assistantMessageId,
      },
      { status: 500 }
    );
  }
}
