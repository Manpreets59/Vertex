import { z } from "zod";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";

import { api } from "../../../../convex/_generated/api";
import { Id, Doc } from "../../../../convex/_generated/dataModel";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

export async function POST(request: Request) {
  try {
    const internalKey = process.env.VERTEX_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      return NextResponse.json(
        { error: "Internal key not configured" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { conversationId, message } = requestSchema.parse(body);

    // Call convex mutation, query
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

    // Find all processing messages in this project
    const processingMessages = await convex.query(
      api.system.getProcessingMessages,
      {
        internalKey,
        projectId,
      }
    );

    if (processingMessages.length > 0) {
      // Cancel all processing messages
      await Promise.all(
        processingMessages.map(async (msg: Doc<"messages">) => {
          await inngest.send({
            name: "message/cancel",
            data: {
              messageId: msg._id,
            },
          });

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

    // Create assistant message placeholder with processing status
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

    // Trigger Inngest to process the message
    const event = await inngest.send({
      name: "message/sent",
      data: {
        messageId: assistantMessageId,
        conversationId: conversationId as Id<"conversations">,
        projectId: projectId as Id<"projects">,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.ids[0],
      messageId: assistantMessageId,
    });
  } catch (error) {
    console.error("Message API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to send message: ${errorMessage}` },
      { status: 500 }
    );
  }
};