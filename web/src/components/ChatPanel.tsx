"use client";

import type { ChatMessage } from "@/lib/types";

type Props = {
  messages: ChatMessage[];
};

export function ChatPanel({ messages }: Props) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="chat-thread" aria-live="polite">
      {messages.map((msg, i) => {
        const isUser = msg.role === "user";
        return (
          <div
            key={`${msg.role}-${i}-${msg.content.slice(0, 24)}`}
            className={`chat-row ${isUser ? "chat-row-user" : "chat-row-assistant"}`}
          >
            <span className="chat-role">{isUser ? "You" : "AI"}</span>
            <div className={isUser ? "chat-bubble-user" : "chat-bubble-assistant"}>
              {msg.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
