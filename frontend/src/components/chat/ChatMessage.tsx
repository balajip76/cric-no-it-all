import type { ChatMsg } from "@/hooks/useChat";

interface Props {
  message: ChatMsg;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-lavender-dark text-lavender-cream rounded-tr-sm"
            : "bg-white text-lavender-dark border border-lavender-rose rounded-tl-sm"
        }`}
      >
        {message.content || (
          <span className="opacity-40 animate-pulse">...</span>
        )}
      </div>
    </div>
  );
}
