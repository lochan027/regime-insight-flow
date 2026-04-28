import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

/**
 * Remove citation markers like .[1], [2], etc. from text
 */
function cleanCitations(text: string): string {
  if (!text) return text;
  // Remove patterns like .[1], . [1], [1], [1][2], and trailing citation blocks
  return text
    .replace(/\s*\.\s*\[\d+\]/g, ".")
    .replace(/\[\d+(?:,?\s*\d+)*\]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\.$/, ".")
    .trim();
}

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey there! 👋 I'm your regime insight copilot. Ask me anything about the current market regime or what you should do with your portfolio.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      loading: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the backend RegimeMind endpoint
      // The backend fetches real market data (/regime/current, /regime/analogues)
      // and sends it all to Perplexity for a data-driven response
      const response = await fetch("/api/copilot/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();
      let explanation = data.answer || "Unable to generate response";
      explanation = cleanCitations(explanation);

      setMessages((prev) => [
        ...prev.filter((m) => !m.loading),
        {
          id: Date.now().toString(),
          role: "assistant",
          content: explanation,
        },
      ]);
    } catch (e: any) {
      console.error("RegimeMind error:", e);
      setMessages((prev) => [
        ...prev.filter((m) => !m.loading),
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `Sorry, I couldn't analyze the market. ${e?.message || "Please try again."}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hey there! 👋 I'm RegimeMind, your AI advisor for macro regime analysis. Ask me anything about the current market regime or what you should do with your portfolio.",
      },
    ]);
  }

  // Prevent page scrolling when the user is scrolling inside the chat messages area.
  // Allow the page to scroll when the chat is already at the top/bottom.
  function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const delta = e.deltaY;
    const atTop = el.scrollTop === 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

    // If we're scrolling up and not at the top, consume the event.
    if (delta < 0 && !atTop) {
      e.stopPropagation();
      return;
    }

    // If we're scrolling down and not at the bottom, consume the event.
    if (delta > 0 && !atBottom) {
      e.stopPropagation();
      return;
    }

    // Otherwise allow event to bubble so the page can scroll.
  }

  return (
    <>
      {/* Floating Bot Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 shadow-lg hover:shadow-xl transition-shadow"
        aria-label="Open RegimeMind"
      >
        <Bot className="h-6 w-6" />
      </motion.button>

      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] rounded-2xl bg-background border hairline shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b hairline">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-600/20 p-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">RegimeMind</h3>
                    <p className="text-xs text-muted-foreground">Macro regime advisor</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 w-8 p-0"
                    title="Clear chat"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 overflow-y-auto" onWheel={handleWheel}>
                <div className="space-y-4" onWheel={handleWheel} onScroll={(e) => e.stopPropagation()}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-surface-2 text-foreground"
                        }`}
                      >
                        {msg.loading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span className="text-xs">Thinking...</span>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t hairline p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me something..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    size="sm"
                    className="px-3"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
