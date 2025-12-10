import { useState } from "react";
import { CBNNavigation } from "@/components/CBNNavigation";
import { ChatSidebar } from "@/components/ChatSidebar";
import { HeroChatSection } from "@/components/HeroChatSection";
import { RecentUpdates } from "@/components/RecentUpdates";
import { AtAGlanceSidebar } from "@/components/AtAGlanceSidebar";
import { ScraperControl } from "@/components/ScraperControl";

const CBNPortal = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <CBNNavigation onChatOpen={() => setIsChatOpen(true)} />

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-8 space-y-12">
            <ScraperControl />
            <HeroChatSection />
            <RecentUpdates />
          </div>

          {/* Sidebar - Right Side */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <AtAGlanceSidebar />
            </div>
          </aside>
        </div>
      </main>

      <ChatSidebar isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default CBNPortal;
