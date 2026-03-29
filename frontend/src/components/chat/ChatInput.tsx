"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-lavender-rose p-3 flex gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask anything..."
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border border-lavender-muted px-3 py-2 text-sm
                   bg-white text-lavender-dark placeholder-lavender-muted
                   focus:outline-none focus:border-lavender-mid disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="bg-lavender-dark text-lavender-cream rounded-xl px-4 py-2 text-sm font-semibold
                   hover:bg-lavender-mid disabled:opacity-40 transition-colors"
      >
        {disabled ? "..." : "Send"}
      </button>
    </div>
  );
}
