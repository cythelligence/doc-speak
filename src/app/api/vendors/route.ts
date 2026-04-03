import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { getAvailableVendors } = await import("@/lib/query-orchestrator");
    const vendors = await getAvailableVendors();
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}
