import { Bell, MessageSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  onChatOpen: () => void;
}

export const Navigation = ({ onChatOpen }: NavigationProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-navy-light rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <span className="text-xl font-bold text-primary">Lexlytic</span>
          </div>

          {/* Menu Items */}
          <div className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm font-medium text-primary hover:text-navy-light transition-colors">
              Home
            </a>
            <a href="/rulebook" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Rulebook
            </a>
            <a href="/alerts" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Alerts
            </a>
            <a href="/reports" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Reports
            </a>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative hover:bg-secondary">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Ask Lexlytic Button */}
          <Button
            onClick={onChatOpen}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Ask Lexlytic</span>
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-secondary">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};
