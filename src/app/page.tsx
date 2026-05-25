"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi. I’m INNER. What has been on your mind lately?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content:
            "I couldn’t respond right now. Check the server or API key, then try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,rgba(88,110,255,0.18),transparent_35%),radial-gradient(circle_at_bottom,rgba(153,102,255,0.12),transparent_35%)]" />

      <div className="relative w-[420px] h-[860px] rounded-[3rem] border border-white/10 bg-[#090909] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.65)]">
        <div className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-xl animate-pulse" />
              <div className="relative w-12 h-12 rounded-full border border-violet-300/40" />
            </div>

            <div>
              <p className="tracking-[0.25em] text-sm text-white/80 uppercase">
                INNER
              </p>
              <p className="text-white/30 text-sm">emotionally present</p>
            </div>
          </div>
        </div>

        <div className="h-[610px] overflow-y-auto p-6 space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={
                message.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[80%] rounded-[2rem] rounded-br-md bg-white/[0.06] border border-white/5 px-5 py-4"
                    : "max-w-[85%] rounded-[2rem] rounded-bl-md bg-violet-500/[0.06] border border-violet-300/10 px-5 py-5"
                }
              >
                <p className="text-white/85 leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-[2rem] rounded-bl-md bg-violet-500/[0.06] border border-violet-300/10 px-5 py-4">
                <p className="text-white/40">INNER is thinking...</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-5 border-t border-white/5 bg-black/40 backdrop-blur-xl">
          <div className="flex flex-col gap-3 rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Talk to INNER..."
              className="w-full min-h-[70px] max-h-[140px] resize-none bg-transparent outline-none text-white placeholder:text-white/25 leading-relaxed"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-violet-500/25 text-white text-sm"
              >
                Go deeper
              </button>

              <button
                type="button"
                className="px-4 py-2 rounded-full bg-white/10 text-white text-sm"
              >
                Deep
              </button>

              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-5 py-2 rounded-full bg-white text-black text-sm font-medium disabled:opacity-40"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}