import { z } from "zod";
import { NextResponse } from "next/server";

import { convex } from "@/lib/convex-client";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

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

    await convex.mutation(api.system.deleteProject, {
      internalKey,
      projectId: projectId as Id<"projects">,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete project error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete project: ${errorMessage}` },
      { status: 500 }
    );
  }
}
