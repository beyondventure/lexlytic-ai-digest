import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Languages, 
  ArrowRightLeft,
  Loader2,
  Copy,
  FileText
} from "lucide-react";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "sw", name: "Swahili", flag: "🇰🇪" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", flag: "🇳🇬" },
  { code: "zu", name: "Zulu", flag: "🇿🇦" },
  { code: "am", name: "Amharic", flag: "🇪🇹" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
];

const TRANSLATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`;

const Translate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("fr");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({ title: "Error", description: "Please enter text to translate", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setTranslatedText("");

    try {
      const response = await fetch(TRANSLATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          text: sourceText,
          sourceLang,
          targetLang,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Translation failed");
      }

      const data = await response.json();
      setTranslatedText(data.translatedText);
    } catch (error: any) {
      console.error("Translation error:", error);
      toast({
        title: "Translation failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(translatedText);
    toast({ title: "Copied to clipboard" });
  };

  const getLanguage = (code: string) => languages.find(l => l.code === code);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <span className="text-xl font-bold text-foreground">Lexlytic</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 pt-24 pb-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Translation</h1>
          <p className="text-muted-foreground">
            AI-powered translation preserving legal terminology and meaning
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select value={sourceLang} onValueChange={setSourceLang}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {getLanguage(sourceLang)?.flag} {getLanguage(sourceLang)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="ghost" size="icon" onClick={swapLanguages}>
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>

                <Select value={targetLang} onValueChange={setTargetLang}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue>
                      {getLanguage(targetLang)?.flag} {getLanguage(targetLang)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map(lang => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleTranslate}
                disabled={isLoading || !sourceText.trim()}
                className="bg-accent hover:bg-accent/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <Languages className="h-4 w-4 mr-2" />
                    Translate
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <span>{getLanguage(sourceLang)?.flag}</span>
                  Source Text
                </label>
                <Textarea
                  placeholder="Enter legal text to translate..."
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {sourceText.length} characters
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <span>{getLanguage(targetLang)?.flag}</span>
                    Translation
                  </label>
                  {translatedText && (
                    <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </div>
                <Textarea
                  placeholder="Translation will appear here..."
                  value={translatedText}
                  readOnly
                  className="min-h-[300px] resize-none bg-secondary/30"
                />
                <p className="text-xs text-muted-foreground">
                  {translatedText.length} characters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent" />
              Legal Translation Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-2">Terminology Preservation</h4>
                <p className="text-sm text-muted-foreground">
                  Legal terms, definitions, and obligations are accurately translated with context awareness.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">African Languages</h4>
                <p className="text-sm text-muted-foreground">
                  Support for major African languages including Swahili, Hausa, Yoruba, Zulu, and Amharic.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Document Upload</h4>
                <p className="text-sm text-muted-foreground">
                  Upload full documents for batch translation with formatting preservation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Translate;
