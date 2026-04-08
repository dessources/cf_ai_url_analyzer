import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * SSE endpoint to stream URL analysis progress from the Durable Object.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing workflow instance ID", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const c = await getCloudflareContext({ async: true });
      const doId = c.env.ANALYSIS_STATE_DO.idFromName(id);
      const stateDO = c.env.ANALYSIS_STATE_DO.get(doId);

      let lastStateStr = "";
      let isDone = false;

      // Simple polling loop inside the stream to catch state changes
      const poll = async () => {
        if (isDone) return;

        try {
          const response = await stateDO.fetch("http://do/get");
          if (!response.ok) throw new Error("DO fetch failed");

          const state = (await response.json()) as { status: string };
          const currentStateStr = JSON.stringify(state);

          // Only send data if state has changed
          if (currentStateStr !== lastStateStr) {
            controller.enqueue(encoder.encode(`data: ${currentStateStr}\n\n`));
            lastStateStr = currentStateStr;
          }

          // Stop polling if workflow finished or failed
          if (state.status === "completed" || state.status === "failed") {
            isDone = true;
            controller.close();
            return;
          }
        } catch (err) {
          console.error("SSE Polling Error:", err);
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`,
            ),
          );
          controller.close();
          isDone = true;
          return;
        }

        // Wait a bit before next poll to avoid hammering the DO
        setTimeout(poll, 1000);
      };

      await poll();
    },
    cancel() {
      // Logic for client disconnect
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
