import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Copy, Check, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'active';
}

interface TeamInviteProps {
  documentId: string;
  documentTitle: string;
}

export function TeamInvite({ documentId, documentTitle }: TeamInviteProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleInvite = () => {
    if (!email.trim() || !email.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    if (members.some(m => m.email === email)) {
      toast({
        title: 'Already invited',
        description: 'This person has already been invited.',
        variant: 'destructive',
      });
      return;
    }

    setMembers([...members, { email, role, status: 'pending' }]);
    setEmail('');
    
    toast({
      title: 'Invitation sent',
      description: `Invitation sent to ${email}`,
    });
  };

  const handleCopyLink = () => {
    const shareLink = `${window.location.origin}/documents/${documentId}?share=true`;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Link copied',
      description: 'Share link copied to clipboard.',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'editor':
        return <Badge variant="default">Editor</Badge>;
      default:
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            Share Document
          </DialogTitle>
          <DialogDescription>
            Invite team members to collaborate on "{documentTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share link</label>
            <div className="flex gap-2">
              <Input
                value={`${window.location.origin}/documents/${documentId}?share=true`}
                readOnly
                className="text-xs"
              />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Invite by email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite by email</label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Select value={role} onValueChange={(v) => setRole(v as any)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite}>
                <Mail className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Team members list */}
          {members.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Invited members</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {members.map((member, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <span className="text-sm">{member.email}</span>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(member.role)}
                      <Badge variant="outline" className="text-xs">
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
