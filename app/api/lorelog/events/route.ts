import { createCodexLorePublicIndex } from "@/lib/codex-lore";
import { readCodexLoreIndex } from "@/lib/codex-lore-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const POLL_INTERVAL_MS = 2000;

function encodeServerEvent(event: string, data: unknown) {
  return new TextEncoder().encode(
    `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  );
}

function encodeHeartbeat() {
  return new TextEncoder().encode(`: pulse ${Date.now()}\n\n`);
}

export async function GET(request: Request) {
  let isClosed = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastGeneratedAt = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      function enqueue(chunk: Uint8Array) {
        if (isClosed) return;

        try {
          controller.enqueue(chunk);
        } catch {
          isClosed = true;
          if (timer) clearInterval(timer);
        }
      }

      async function sendSnapshot() {
        if (isClosed) return;

        try {
          const index = await readCodexLoreIndex();

          if (isClosed) return;

          if (index.generatedAt !== lastGeneratedAt) {
            lastGeneratedAt = index.generatedAt;
            enqueue(
              encodeServerEvent("lorelog", createCodexLorePublicIndex(index)),
            );
          } else {
            enqueue(encodeHeartbeat());
          }
        } catch {
          enqueue(encodeServerEvent("lorelog-error", {}));
        }
      }

      await sendSnapshot();
      timer = setInterval(sendSnapshot, POLL_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        isClosed = true;
        if (timer) clearInterval(timer);

        try {
          controller.close();
        } catch {
          // The browser may close the stream before the interval notices.
        }
      });
    },
    cancel() {
      isClosed = true;
      if (timer) clearInterval(timer);
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
