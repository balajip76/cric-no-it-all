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

  // Reset chat when format changes
  useEffect(() => {
    resetSession();
  }, [format, resetSession]);

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-cricket-green-50">
        <h2 className="font-semibold text-cricket-green-800 text-sm">
          AI Cricket Insights
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Powered by Claude · {format.toUpperCase()} context
        </p>
      </div>

      <ChatMessages messages={messages} />

      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      <ChatInput onSend={sendMessage} disabled={streaming} />
    </div>
  );
}
