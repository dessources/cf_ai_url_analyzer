import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

// export const runtime = "edge";

/**
 * Endpoint to fetch current URL analysis progress from the Durable Object.
 * Used for polling from the frontend.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Missing workflow instance ID" },
      { status: 400 },
    );
  }

  try {
    const c = await getCloudflareContext({ async: true });
    const doId = c.env.ANALYSIS_STATE_DO.idFromName(id);
    const stateDO = c.env.ANALYSIS_STATE_DO.get(doId);

    const response = await stateDO.fetch("http://do/get");
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch state from Durable Object" },
        { status: 500 },
      );
    }

    const state = await response.json();
    return NextResponse.json(state);
  } catch (err: any) {
    console.error("Status Polling Error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
