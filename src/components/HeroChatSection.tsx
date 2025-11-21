import { Send, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const suggestions = [
  "What changed in CBN KYC rules this year?",
  "List circulars affecting fintechs in the last 6 months",
  "Summarise the latest guideline on digital lending",
  "What are the requirements for Tier-1 wallets?",
  "Explain FX reporting obligations for PSPs",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Array<{
    title: string;
    reference: string;
    date: string;
  }>;
  obligations?: string[];
}

export const HeroChatSection = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const handleSend = (question?: string) => {
    const queryText = question || input;
    if (!queryText.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: queryText };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content:
          "The CBN has introduced updated KYC requirements for digital financial services. Here's a plain English summary of what you need to know:",
        obligations: [
          "Enhanced identity verification required for all wallet tiers",
          "Biometric authentication mandatory for transactions above ₦100,000",
          "Quarterly compliance reporting to CBN starting July 2025",
          "Updated data protection standards aligned with NDPR",
        ],
        citations: [
          {
            title: "CBN Circular on Enhanced KYC Requirements",
            reference: "BSD/DIR/PUB/03/2025",
            date: "15 March 2025",
          },
        ],
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="space-y-6">
      {/* Hero Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full mb-4">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI-Powered Regulatory Intelligence</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
          Ask Lexlytic about any CBN rule...
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Get instant answers about Central Bank of Nigeria regulations in plain English
        </p>
      </div>

      {/* Input Box */}
      <div className="max-w-3xl mx-auto">
        <div className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a question... e.g. 'What are the latest rules on Tier-1 wallets?'"
            className="h-14 pr-14 text-base shadow-md border-2 focus:border-accent"
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            className="absolute right-2 top-2 bg-accent hover:bg-accent/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Suggestion Chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSend(suggestion)}
                className="text-xs hover:bg-accent/10 hover:text-accent hover:border-accent"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Thread */}
      {messages.length > 0 && (
        <div className="max-w-3xl mx-auto space-y-4 mt-8">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`p-6 ${
                message.role === "user" ? "bg-secondary" : "bg-card shadow-md"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-accent to-teal rounded-full flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <span className="font-semibold text-foreground">
                    {message.role === "user" ? "You" : "Lexlytic"}
                  </span>
                </div>

                <p className="text-foreground leading-relaxed">{message.content}</p>

                {message.obligations && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <p className="font-semibold text-sm text-primary">Key Obligations:</p>
                    <ul className="space-y-1.5">
                      {message.obligations.map((obligation, idx) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-accent mt-1">•</span>
                          <span>{obligation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {message.citations && message.citations.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-primary">Citations:</p>
                    {message.citations.map((citation, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 bg-teal-light rounded-lg p-3 border border-accent/20"
                      >
                        <FileText className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {citation.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Source: {citation.reference} • Issued: {citation.date}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-accent hover:text-accent/80"
                            >
                              View full circular
                            </Button>
                            <span className="text-muted-foreground">•</span>
                            <Button
                              variant="link"
                              size="sm"
                              className="h-auto p-0 text-accent hover:text-accent/80"
                            >
                              Open in Rulebook
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center italic max-w-2xl mx-auto">
            This summary is based on official CBN publications. Please review the cited documents
            before making final decisions.
          </p>
        </div>
      )}
    </div>
  );
};
