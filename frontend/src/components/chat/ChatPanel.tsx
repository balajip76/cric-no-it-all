"use client";

import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import type { CricketFormat } from "@/types/database.types";

interface Props {
  howstatId: number;
  format: CricketFormat;
}

export default function ChatPanel({ howstatId, format }: Props) {
  const { messages, streaming, error, sendMessage, resetSession } = useChat(
    howstatId,
    format
  );

  useEffect(() => {
    resetSession();
  }, [format, resetSession]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-lavender-rose bg-lavender-cream shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-lavender-rose bg-lavender-dark">
        <h2 className="font-semibold text-lavender-cream text-sm">
          AI Cricket Insights
        </h2>
        <p className="text-xs text-lavender-rose mt-0.5">
          Powered by Claude · {format.toUpperCase()} context
        </p>
      </div>

      <ChatMessages messages={messages} />

      {error && (
        <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  );
}
