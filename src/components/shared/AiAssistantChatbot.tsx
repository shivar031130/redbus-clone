"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Image as ImageIcon, Loader2, Send, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export function AiAssistantChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Travel Assistant. How can I help you book tickets or find routes today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const [puterInstance, setPuterInstance] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick questions to help the user get started
  const quickQuestions = [
    "How do I book a ticket?",
    "What are the popular routes in Malaysia?",
    "Is my payment secure?",
    "What is the cancellation policy?"
  ];

  // Dynamic import of puter to avoid Next.js SSR error
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason;
        // Suppress unhandled promise rejections from Puter.js's internal XHR/whoami calls
        if (
          reason &&
          (reason instanceof XMLHttpRequest || 
           (typeof reason === "object" && (reason._puterReq || reason.status === 401 || reason.message === "Unauthorized")))
        ) {
          event.preventDefault();
        }
      };

      window.addEventListener("unhandledrejection", handleUnhandledRejection);

      import("@heyputer/puter.js")
        .then((module) => {
          setPuterInstance(module.puter);
        })
        .catch((err) => {
          console.error("Failed to load Puter.js:", err);
        });

      return () => {
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      };
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages update
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (text: string) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    const promptToSend = text.trim() || "Analyze this image and describe what you see.";
    const currentImage = selectedImage;

    const userMessage: Message = { role: "user", content: promptToSend, image: currentImage || undefined };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(true);

    try {
      let responseText = "";

      if (puterInstance) {
        // System prompt context to guide the model
        const systemPrompt = `You are a helpful, friendly AI Travel Assistant for redBusMalaysia, a premium bus ticket booking platform.
You should assist users with booking tickets, looking up routes (e.g. Kuala Lumpur to Penang, Johor Bahru to Larkin, etc.), explaining features, refund policies, security, and other passenger queries.
Be polite, concise, and helpful.
User Question: ${promptToSend}`;

        const getResponseText = (res: any): string => {
          if (typeof res === "string") return res;
          if (res && res.message) {
            if (typeof res.message.content === "string") return res.message.content;
            if (typeof res.message === "string") return res.message;
          }
          if (res && typeof res.content === "string") return res.content;
          return res ? String(res) : "";
        };

        try {
          // Attempt using the nex-agi/nex-n2-pro:free model
          const response = currentImage
            ? await puterInstance.ai.chat(systemPrompt, currentImage, {
              model: "nex-agi/nex-n2-pro:free"
            })
            : await puterInstance.ai.chat(systemPrompt, {
              model: "nex-agi/nex-n2-pro:free"
            });
          responseText = getResponseText(response);
        } catch (modelErr) {
          console.warn("nex-agi/nex-n2-pro:free model failed, falling back to default Puter model...", modelErr);
          // Fallback to default Puter model
          const response = currentImage
            ? await puterInstance.ai.chat(systemPrompt, currentImage)
            : await puterInstance.ai.chat(systemPrompt);
          responseText = getResponseText(response);
        }
      } else {
        responseText = "I'm still warming up! Please try again in a few seconds once Puter AI initializes.";
      }

      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    } catch (err: any) {
      console.error("Error communicating with Puter AI:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I ran into an issue communicating with the AI service. If prompted, please make sure you log in to your Puter account, or try again shortly."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-red-700 to-rose-800 text-white shadow-2xl hover:shadow-red-900/30 hover:scale-105 transition-all duration-300 group flex items-center gap-2 border border-white/10"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-medium text-sm whitespace-nowrap">
            AI Assistant
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-4rem)] rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-red-900 to-rose-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/10">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Travel Assistant</h3>
                <p className="text-[10px] text-white/70">Powered by Puter AI & Nex-N2-Pro</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border text-xs",
                    msg.role === "user"
                      ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      : "bg-red-950/10 dark:bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
                  )}
                >
                  {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm leading-relaxed flex flex-col gap-2",
                    msg.role === "user"
                      ? "bg-red-700 text-white rounded-tr-none"
                      : "bg-zinc-100/80 dark:bg-zinc-900/85 text-zinc-800 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-800/50 rounded-tl-none"
                  )}
                >
                  {msg.image && (
                    <div className="rounded-lg overflow-hidden border border-zinc-200/20 dark:border-zinc-800/20 max-w-full">
                      <img src={msg.image} alt="Sent attachment" className="max-h-40 object-contain bg-black/5" />
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%] mr-auto">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border bg-red-950/10 dark:bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-zinc-100/80 dark:bg-zinc-900/85 rounded-2xl rounded-tl-none px-3.5 py-2 border border-zinc-200/50 dark:border-zinc-800/50 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-700 dark:text-red-400" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions (Visible when no active query is running) */}
          {messages.length === 1 && !isLoading && (
            <div className="px-4 pb-2">
              <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">Frequently Asked Questions:</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-left text-[11px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-600 dark:text-zinc-300 hover:text-red-700 dark:hover:text-red-400 border border-zinc-200/60 dark:border-zinc-800/60 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Attachment Preview */}
          {selectedImage && (
            <div className="px-4 py-2 border-t border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between animate-in fade-in duration-200">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                <img src={selectedImage} alt="Attachment Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground mr-auto ml-3 font-medium">Image attachment ready</span>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 flex gap-2 items-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-muted-foreground hover:text-foreground shrink-0 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Attach Image"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedImage ? "Describe this image..." : "Ask anything about your travel..."}
              disabled={isLoading}
              className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-red-500/50 focus:border-red-500/50 disabled:opacity-50"
            />
            <Button
              type="submit"
              size="icon-sm"
              disabled={isLoading || (!input.trim() && !selectedImage)}
              className="bg-red-700 hover:bg-red-800 text-white shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
