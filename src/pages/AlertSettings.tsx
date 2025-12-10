import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Bell, 
  Plus, 
  X,
  Loader2,
  Globe,
  Building2,
  Tag
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const jurisdictionOptions = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "European Union", "United States", "United Kingdom"
];

const sectorOptions = [
  "Banking", "Fintech", "Insurance", "Healthcare", "Technology", "Manufacturing", "Retail"
];

const AlertSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [newKeyword, setNewKeyword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    jurisdictions: [] as string[],
    sectors: [] as string[],
    keywords: [] as string[],
    frequency: "realtime",
    emailEnabled: true,
    isActive: true,
  });

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

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["alert_subscriptions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("alert_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("alert_subscriptions").insert({
        user_id: user.id,
        name: formData.name || "New Alert",
        jurisdictions: formData.jurisdictions,
        sectors: formData.sectors,
        keywords: formData.keywords,
        frequency: formData.frequency,
        email_enabled: formData.emailEnabled,
        is_active: formData.isActive,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert_subscriptions"] });
      toast({ title: "Alert created", description: "Your alert subscription has been created." });
      setFormData({
        name: "",
        jurisdictions: [],
        sectors: [],
        keywords: [],
        frequency: "realtime",
        emailEnabled: true,
        isActive: true,
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alert_subscriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert_subscriptions"] });
      toast({ title: "Alert deleted" });
    },
  });

  const addToArray = (field: "jurisdictions" | "sectors", value: string) => {
    if (!formData[field].includes(value)) {
      setFormData({ ...formData, [field]: [...formData[field], value] });
    }
  };

  const removeFromArray = (field: "jurisdictions" | "sectors" | "keywords", value: string) => {
    setFormData({ ...formData, [field]: formData[field].filter(v => v !== value) });
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !formData.keywords.includes(newKeyword.trim())) {
      setFormData({ ...formData, keywords: [...formData.keywords, newKeyword.trim()] });
      setNewKeyword("");
    }
  };

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

      <main className="container mx-auto px-6 pt-24 pb-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Alert Settings</h1>
          <p className="text-muted-foreground">
            Configure your regulatory alert subscriptions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create New Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Alert
              </CardTitle>
              <CardDescription>Set up a new regulatory alert subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alert Name</Label>
                <Input
                  placeholder="e.g., Nigeria Banking Updates"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Jurisdictions
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.jurisdictions.map(j => (
                    <Badge key={j} variant="secondary" className="gap-1">
                      {j}
                      <button onClick={() => removeFromArray("jurisdictions", j)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(v) => addToArray("jurisdictions", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add jurisdiction" />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictionOptions.filter(j => !formData.jurisdictions.includes(j)).map(j => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Sectors
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.sectors.map(s => (
                    <Badge key={s} variant="secondary" className="gap-1">
                      {s}
                      <button onClick={() => removeFromArray("sectors", s)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={(v) => addToArray("sectors", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectorOptions.filter(s => !formData.sectors.includes(s)).map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Keywords
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.keywords.map(k => (
                    <Badge key={k} variant="secondary" className="gap-1">
                      {k}
                      <button onClick={() => removeFromArray("keywords", k)}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" variant="outline" onClick={addKeyword}>Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) => setFormData({ ...formData, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Digest</SelectItem>
                    <SelectItem value="monthly">Monthly Digest</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>Email Notifications</Label>
                <Switch
                  checked={formData.emailEnabled}
                  onCheckedChange={(v) => setFormData({ ...formData, emailEnabled: v })}
                />
              </div>

              <Button
                className="w-full bg-accent hover:bg-accent/90"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Alert
              </Button>
            </CardContent>
          </Card>

          {/* Existing Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Your Alerts
              </CardTitle>
              <CardDescription>Manage your existing subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-foreground">{sub.name}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => deleteMutation.mutate(sub.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {sub.jurisdictions?.map((j: string) => (
                          <Badge key={j} variant="outline" className="text-xs">{j}</Badge>
                        ))}
                        {sub.sectors?.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="capitalize">{sub.frequency}</span>
                        <Badge variant={sub.is_active ? "default" : "secondary"}>
                          {sub.is_active ? "Active" : "Paused"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No alerts configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AlertSettings;
