import { X, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    title: string;
    reference: string;
    date: string;
  }>;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSidebar = ({ isOpen, onClose }: ChatSidebarProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your CBN regulatory assistant. Ask me anything about Central Bank of Nigeria circulars and guidelines.",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        role: "assistant",
        content: "Based on the latest CBN regulations, here's what you need to know:\n\n• KYC requirements for Tier-1 wallets have been updated\n• New documentation standards apply from Q3 2025\n• Enhanced verification processes for fintech PSPs\n\nThese changes aim to strengthen consumer protection and reduce fraud.",
        citations: [
          {
            title: "CBN Circular on Tier-1 Wallet KYC Requirements",
            reference: "BSD/DIR/PUB/03/2025",
            date: "15 March 2025",
          },
        ],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);

    setInput("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary to-navy-light">
        <div>
          <h2 className="text-lg font-semibold text-primary-foreground">Ask Lexlytic</h2>
          <p className="text-xs text-primary-foreground/80">CBN Regulatory Assistant</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-line">{message.content}</p>

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {message.citations.map((citation, idx) => (
                      <div
                        key={idx}
                        className="bg-card/50 border border-border rounded p-2 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{citation.title}</p>
                            <p className="text-muted-foreground mt-0.5">
                              {citation.reference} • {citation.date}
                            </p>
                            <Button
                              variant="link"
                              className="h-auto p-0 text-accent hover:text-accent/80 mt-1"
                              size="sm"
                            >
                              View circular
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask a question... e.g. 'Does this circular affect non-bank PSPs?'"
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon" className="bg-accent hover:bg-accent/90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
