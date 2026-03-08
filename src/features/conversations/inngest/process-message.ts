import { inngest } from "@/inngest/client";
import { Id } from "../../../../convex/_generated/dataModel";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: string;
}

const SYSTEM_PROMPT = `You are Vertex, an expert AI coding assistant. Help users by analyzing their code and answering questions about their projects. Provide helpful, clear, and accurate responses.`;

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;
      const internalKey = process.env.VERTEX_CONVEX_INTERNAL_KEY;

      // Update the message with error content
      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
          });
        });
      }
    }
  },
  {
    event: "message/sent",
  },
  async ({ event, step }) => {
    const { messageId, conversationId, projectId, message } = event.data as MessageEvent;

    const internalKey = process.env.VERTEX_CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError("VERTEX_CONVEX_INTERNAL_KEY is not configured");
    }

    // Get recent messages for context
    const recentMessages = await step.run("fetch-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 10,
      });
    });

    // Build message history for the model
    const messageHistory = recentMessages
      .filter((msg) => msg.content) // Only include messages with content
      .map((msg) => (`${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`))
      .join("\n\n");

    // Generate response using Google Gemini
    let agentResponse = "";
    await step.run("agent-processing", async () => {
      try {
        console.log("Calling Gemini with message:", { message, messageHistory });
        const result = await generateText({
          model: google("gemini-2.0-flash"),
          system: SYSTEM_PROMPT,
          prompt: messageHistory
            ? `Previous conversation:\n${messageHistory}\n\nUser: ${message}`
            : `User: ${message}`,
        });

        console.log("Gemini response:", result);
        agentResponse = result.text || "";

        if (!agentResponse) {
          agentResponse = "I received your message but couldn't generate a response. Please try again.";
        }
      } catch (error) {
        console.error("AI Processing error:", error);
        agentResponse = `I encountered an error processing your request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
    });

    // Update conversation title if this is the first message
    await step.run("update-title-if-needed", async () => {
      const conversation = await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });

      if (!conversation?.title || conversation.title === "Untitled Conversation") {
        try {
          const { text: title } = await generateText({
            model: google("gemini-2.0-flash"),
            prompt: `Generate a short 3-6 word title for this message: "${message}". Return only the title.`,
          });

          await convex.mutation(api.system.updateConversationTitle, {
            internalKey,
            conversationId,
            title: title.trim().substring(0, 100),
          });
        } catch {
          // Ignore title generation errors
        }
      }
    });

    // Update the assistant message with the response
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: agentResponse
      })
    });
  }
);
