"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { useSession } from "next-auth/react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function ChatWidget() {
  const { status } = useSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Merhaba! Nexora destek hattına hoş geldiniz. Size nasıl yardımcı olabilirim?",
    },
  ]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    if (status !== "authenticated") {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sipariş ve destek için lütfen giriş yapın.",
        },
      ]);
      return;
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.filter((message) => message.role === "user"),
        }),
      });

      if (!response.ok || !response.body) {
        if (response.status === 401) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Sipariş ve destek için lütfen giriş yapın." },
          ]);
          return;
        }
        if (response.status === 503) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "AI destek şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
            },
          ]);
          return;
        }
        throw new Error("Failed to stream response.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = { ...updated[lastIndex], content: assistantText };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen tekrar deneyin." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#6366f1] text-white shadow-[0_8px_30px_rgba(99,102,241,0.5)] transition hover:bg-[#5458e8]"
        aria-label="AI chat widget"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-[70] flex h-[450px] w-[300px] flex-col rounded-2xl border border-[#2a2a2a] bg-[#111111]">
          <div className="border-b border-[#1f1f1f] px-4 py-3 text-sm font-medium text-white">
            Nexora AI Destek
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-[#6366f1] text-white"
                    : "bg-[#1a1a1a] text-zinc-200"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#1f1f1f] p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Mesajınızı yazın..."
              className="w-full rounded-lg border border-[#2a2a2a] bg-[#0d0d0d] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-[#6366f1] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#6366f1] text-white transition hover:bg-[#5458e8] disabled:opacity-60"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
