import { Bell, MessageSquare, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavLink } from "@/components/NavLink";

interface CBNNavigationProps {
  onChatOpen: () => void;
}

export const CBNNavigation = ({ onChatOpen }: CBNNavigationProps) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">L</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary leading-tight">Lexlytic</span>
                <span className="text-xs text-muted-foreground leading-tight">CBN Co-pilot</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink 
              to="/cbn-copilot" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Home
            </NavLink>
            <NavLink 
              to="/cbn-copilot/rulebook" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Rulebook
            </NavLink>
            <NavLink 
              to="/cbn-copilot/alerts" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Alerts
            </NavLink>
            <NavLink 
              to="/cbn-copilot/reports" 
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              activeClassName="text-primary font-semibold"
            >
              Reports
            </NavLink>
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
