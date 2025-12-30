import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Database, Shield, Bell, Globe } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export const PlatformSettingsCard = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    autoConfirmEmail: true,
    enableAlerts: true,
    publicDocs: false,
    auditLog: true,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({ title: 'Setting updated' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Platform Settings
        </CardTitle>
        <CardDescription>Configure platform-wide settings and preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="autoConfirm" className="font-medium">Auto-confirm Email Signups</Label>
                <p className="text-xs text-muted-foreground">Skip email verification for new users</p>
              </div>
            </div>
            <Switch
              id="autoConfirm"
              checked={settings.autoConfirmEmail}
              onCheckedChange={() => handleToggle('autoConfirmEmail')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Bell className="h-4 w-4 text-warning" />
              </div>
              <div>
                <Label htmlFor="alerts" className="font-medium">Enable Regulatory Alerts</Label>
                <p className="text-xs text-muted-foreground">Send notifications for regulatory updates</p>
              </div>
            </div>
            <Switch
              id="alerts"
              checked={settings.enableAlerts}
              onCheckedChange={() => handleToggle('enableAlerts')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Globe className="h-4 w-4 text-info" />
              </div>
              <div>
                <Label htmlFor="publicDocs" className="font-medium">Public Document Access</Label>
                <p className="text-xs text-muted-foreground">Allow anonymous access to public documents</p>
              </div>
            </div>
            <Switch
              id="publicDocs"
              checked={settings.publicDocs}
              onCheckedChange={() => handleToggle('publicDocs')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Database className="h-4 w-4 text-accent" />
              </div>
              <div>
                <Label htmlFor="auditLog" className="font-medium">Audit Logging</Label>
                <p className="text-xs text-muted-foreground">Track all user actions for compliance</p>
              </div>
            </div>
            <Switch
              id="auditLog"
              checked={settings.auditLog}
              onCheckedChange={() => handleToggle('auditLog')}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">System Status</p>
              <p className="text-xs text-muted-foreground">All services operational</p>
            </div>
            <Badge className="bg-success">Healthy</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
