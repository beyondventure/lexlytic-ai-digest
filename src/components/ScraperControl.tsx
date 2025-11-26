import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ScraperControl = () => {
  const [isScraperRunning, setIsScraperRunning] = useState(false);
  const { toast } = useToast();

  const runScraper = async () => {
    setIsScraperRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-cbn');
      
      if (error) throw error;

      toast({
        title: "Scraping Complete",
        description: `Successfully processed ${data.processed} documents`,
      });
    } catch (error) {
      console.error('Scraper error:', error);
      toast({
        title: "Scraping Failed",
        description: error instanceof Error ? error.message : "Failed to scrape CBN website",
        variant: "destructive",
      });
    } finally {
      setIsScraperRunning(false);
    }
  };

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">CBN Data Sync</h3>
          <p className="text-sm text-muted-foreground">
            Fetch latest documents from CBN website
          </p>
        </div>
        <Button
          onClick={runScraper}
          disabled={isScraperRunning}
          className="bg-accent hover:bg-accent/90"
        >
          {isScraperRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Sync Now
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
