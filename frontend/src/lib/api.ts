const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function triggerScrape(howstatId: number) {
  const res = await fetch(`${API_URL}/api/v1/players/${howstatId}/scrape`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Scrape failed: ${res.statusText}`);
  return res.json();
}

export async function forceRefresh(howstatId: number) {
  const res = await fetch(`${API_URL}/api/v1/players/${howstatId}/refresh`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.statusText}`);
  return res.json();
}

export async function createChatSession(howstatId: number, formatContext: string) {
  const res = await fetch(`${API_URL}/api/v1/chat/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ howstat_id: howstatId, format_context: formatContext }),
  });
  if (!res.ok) throw new Error(`Create session failed: ${res.statusText}`);
  return res.json() as Promise<{ id: string }>;
}

export function streamChatMessage(
  sessionId: string,
  message: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(
        `${API_URL}/api/v1/chat/sessions/${sessionId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        }
      );

      if (!res.ok || !res.body) {
        throw new Error(`Stream failed: ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) onChunk(parsed.text);
            } catch {
              // ignore malformed lines
            }
          }
        }
      }
      onDone();
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError(err as Error);
      }
    }
  })();

  return () => controller.abort();
}
