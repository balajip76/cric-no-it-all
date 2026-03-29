"use client";

import { useState, useCallback, useRef } from "react";
import { createChatSession, streamChatMessage } from "@/lib/api";
import type { CricketFormat } from "@/types/database.types";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export function useChat(howstatId: number, format: CricketFormat) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const ensureSession = useCallback(async () => {
    if (!sessionIdRef.current) {
      const session = await createChatSession(howstatId, format);
      sessionIdRef.current = session.id;
    }
    return sessionIdRef.current;
  }, [howstatId, format]);

  // When format changes, reset session so a new one is created
  const resetSession = useCallback(() => {
    sessionIdRef.current = null;
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (streaming) return;
      setError(null);

      const userMsg: ChatMsg = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);

      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      setStreaming(true);
      try {
        const sessionId = await ensureSession();

        cancelRef.current = streamChatMessage(
          sessionId,
          text,
          (chunk) => {
            assistantContent += chunk;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantContent,
              };
              return updated;
            });
          },
          () => setStreaming(false),
          (err) => {
            setError(err.message);
            setStreaming(false);
          }
        );
      } catch (err) {
        setError((err as Error).message);
        setStreaming(false);
      }
    },
    [streaming, ensureSession]
  );

  const cancel = useCallback(() => {
    cancelRef.current?.();
    setStreaming(false);
  }, []);

  return { messages, streaming, error, sendMessage, cancel, resetSession };
}
