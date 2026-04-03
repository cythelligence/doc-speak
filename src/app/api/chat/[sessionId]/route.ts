import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { executeQuery } from "@/lib/query-orchestrator";

const prisma = new PrismaClient();

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { message, vendorIds } = await req.json();

    if (!message || !vendorIds || vendorIds.length === 0) {
      return NextResponse.json(
        { error: "Missing message or vendorIds" },
        { status: 400 }
      );
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        sessionId: params.sessionId,
        role: "user",
        content: message,
      },
    });

    // Execute query through orchestrator
    const queryResult = await executeQuery({
      vendorIds,
      query: message,
      maxContext: 10,
    });

    // Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        sessionId: params.sessionId,
        role: "assistant",
        content: queryResult.answer,
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
      sources: queryResult.sources,
      model: queryResult.model,
      provider: queryResult.provider,
    });
  } catch (error) {
    console.error("Error processing chat:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
