import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface SessionRequest {
  title: string;
  vendorIds?: string[];
}

export async function GET() {
  try {
    const sessions = await prisma.chatSession.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        vendorIds: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: SessionRequest = await req.json();

    const session = await prisma.chatSession.create({
      data: {
        title: body.title,
        vendorIds: JSON.stringify(body.vendorIds || []),
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
