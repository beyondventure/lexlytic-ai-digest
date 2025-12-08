import { Send, Sparkles, FileText, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

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
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Function to extract and render PDF links
const renderMessageContent = (content: string, navigate: ReturnType<typeof useNavigate>) => {
  const pdfUrlRegex = /(https?:\/\/[^\s)]+\.pdf)/gi;
  const parts: Array<{ type: 'text' | 'link'; content: string; url?: string }> = [];
  
  let lastIndex = 0;
  let match;
  
  while ((match = pdfUrlRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', content: 'View Circular', url: match[0] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < content.length) {
    parts.push({ type: 'text', content: content.slice(lastIndex) });
  }
  
  if (parts.length === 0) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }
  
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (part.type === 'link' && part.url) {
          return (
            <span key={idx} className="inline-flex items-center gap-2 mx-1">
              <a
                href={part.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:text-accent/80 underline font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                View Circular
              </a>
              <button
                onClick={() => navigate('/rulebook')}
                className="text-accent hover:text-accent/80 underline font-medium text-sm"
              >
                Open in Rulebook
              </button>
            </span>
          );
        }
        return <span key={idx}>{part.content}</span>;
      })}
    </span>
  );
};

export const HeroChatSection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const streamChat = async (userMessages: ChatMessage[]) => {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to get response");
    }

    if (!response.body) {
      throw new Error("No response stream available");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: assistantContent,
              };
              return updated;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const handleSend = async (question?: string) => {
    const queryText = question || input;
    if (!queryText.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: queryText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      await streamChat(updatedMessages);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
      setMessages((prev) => prev.filter((m) => m.content.trim() !== ""));
    } finally {
      setIsLoading(false);
    }
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
          Get instant answers about Central Bank of Nigeria regulations with specific circular references
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
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            size="icon"
            className="absolute right-2 top-2 bg-accent hover:bg-accent/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
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
                disabled={isLoading}
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

                <div className="text-foreground leading-relaxed">
                  {message.role === "assistant" 
                    ? renderMessageContent(message.content, navigate)
                    : message.content
                  }
                </div>
              </div>
            </Card>
          ))}

          {isLoading && messages[messages.length - 1]?.content === "" && (
            <Card className="p-6 bg-card shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-teal rounded-full flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                </div>
                <span className="text-muted-foreground">Searching CBN database...</span>
              </div>
            </Card>
          )}

          {/* Follow-up Input */}
          <div className="relative mt-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask a follow-up question..."
              className="h-12 pr-14 text-base border-2 focus:border-accent"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              size="icon"
              className="absolute right-2 top-1.5 bg-accent hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center italic max-w-2xl mx-auto mt-4">
            Responses include links to official CBN circulars. Click "View Circular" to access the PDF directly.
          </p>
        </div>
      )}
    </div>
  );
};
