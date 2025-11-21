import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Tag, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentAlerts = [
  {
    title: "New circular on FX reporting",
    time: "2 days ago",
    type: "info",
  },
  {
    title: "Digital lending guideline updated",
    time: "1 week ago",
    type: "warning",
  },
  {
    title: "PSP license renewal deadline approaching",
    time: "3 days ago",
    type: "urgent",
  },
];

const watchlistTags = ["FX", "Digital Lending", "Fintech PSPs", "KYC/AML", "Consumer Protection"];

const upcomingDates = [
  {
    title: "FX Reporting Framework Implementation",
    date: "30 Sept 2025",
    daysLeft: 45,
  },
  {
    title: "Enhanced KYC Requirements Effective",
    date: "1 July 2025",
    daysLeft: 78,
  },
  {
    title: "Quarterly Compliance Report Due",
    date: "15 June 2025",
    daysLeft: 62,
  },
];

export const AtAGlanceSidebar = () => {
  return (
    <div className="space-y-6">
      {/* Recent Alerts */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Recent Alerts</h3>
        </div>
        <div className="space-y-3">
          {recentAlerts.map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              <div
                className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  alert.type === "urgent"
                    ? "bg-destructive"
                    : alert.type === "warning"
                    ? "bg-warning"
                    : "bg-info"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {alert.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.time}</p>
              </div>
            </div>
          ))}
        </div>
        <Button variant="link" className="w-full mt-3 text-accent hover:text-accent/80">
          View all alerts
        </Button>
      </Card>

      {/* Watchlist */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Your Watchlist</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {watchlistTags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <Button variant="link" className="w-full mt-3 text-accent hover:text-accent/80">
          Manage watchlist
        </Button>
      </Card>

      {/* Upcoming Dates */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Upcoming Dates</h3>
        </div>
        <div className="space-y-4">
          {upcomingDates.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-accent transition-colors cursor-pointer group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendingUp className="h-3 w-3 text-warning" />
                  <span className="text-xs font-medium text-warning">
                    {item.daysLeft} days left
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
