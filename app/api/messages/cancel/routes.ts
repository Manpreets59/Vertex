import { z } from "zod";
import { NextResponse } from "next/server";

import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";

import { api } from "../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../convex/_generated/dataModel";

const requestSchema = z.object({
  projectId: z.string(),
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
    const { projectId } = requestSchema.parse(body);

    // Find all processing messages in this project
    const processingMessages = await convex.query(
      api.system.getProcessingMessages,
      {
        internalKey,
        projectId: projectId as Id<"projects">,
      }
    );

    if (processingMessages.length === 0) {
      return NextResponse.json({ success: true, cancelled: false });
    }

    // Cancel all processing messages
    const cancelledIds = await Promise.all(
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

        return msg._id;
      })
    );

    return NextResponse.json({
      success: true,
      cancelled: true,
      messageIds: cancelledIds,
    });
  } catch (error) {
    console.error("Cancel message error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to cancel message: ${errorMessage}` },
      { status: 500 }
    );
  }
}
