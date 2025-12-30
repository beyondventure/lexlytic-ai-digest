import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Users,
  Shield,
  Settings,
  UserPlus,
  Search,
  MoreHorizontal,
  FileText,
  Activity,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'suspended';
  lastActive: string;
  documentsAccessed: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate('/auth');
    });
  }, [navigate]);

  // Demo team members data
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: 'admin@lexlytic.com',
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      lastActive: new Date().toISOString(),
      documentsAccessed: 45,
    },
    {
      id: '2',
      email: 'legal@company.com',
      name: 'Legal Team Lead',
      role: 'editor',
      status: 'active',
      lastActive: new Date(Date.now() - 3600000).toISOString(),
      documentsAccessed: 32,
    },
    {
      id: '3',
      email: 'compliance@company.com',
      name: 'Compliance Officer',
      role: 'viewer',
      status: 'active',
      lastActive: new Date(Date.now() - 86400000).toISOString(),
      documentsAccessed: 18,
    },
    {
      id: '4',
      email: 'new.user@company.com',
      name: 'New User',
      role: 'viewer',
      status: 'pending',
      lastActive: '',
      documentsAccessed: 0,
    },
  ]);

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInvite = () => {
    if (!inviteEmail.includes('@')) {
      toast({
        title: 'Invalid email',
        variant: 'destructive',
      });
      return;
    }

    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      email: inviteEmail,
      name: inviteEmail.split('@')[0],
      role: inviteRole,
      status: 'pending',
      lastActive: '',
      documentsAccessed: 0,
    };

    setTeamMembers([...teamMembers, newMember]);
    setInviteEmail('');
    setIsInviteOpen(false);
    toast({
      title: 'Invitation sent',
      description: `Invitation sent to ${inviteEmail}`,
    });
  };

  const handleRoleChange = (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    setTeamMembers(
      teamMembers.map((m) =>
        m.id === memberId ? { ...m, role: newRole } : m
      )
    );
    toast({
      title: 'Role updated',
    });
  };

  const handleStatusChange = (memberId: string, newStatus: 'active' | 'suspended') => {
    setTeamMembers(
      teamMembers.map((m) =>
        m.id === memberId ? { ...m, status: newStatus } : m
      )
    );
    toast({
      title: `User ${newStatus === 'active' ? 'activated' : 'suspended'}`,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-destructive">Admin</Badge>;
      case 'editor':
        return <Badge className="bg-accent">Editor</Badge>;
      default:
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success">Active</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="destructive">Suspended</Badge>;
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
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

      <main className="container mx-auto px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
              <p className="text-muted-foreground">
                Manage users, roles, and platform access
              </p>
            </div>
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your Lexlytic workspace
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    type="email"
                    placeholder="email@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                      <SelectItem value="editor">Editor - Can edit documents</SelectItem>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} className="w-full">
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{teamMembers.length}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <Activity className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers.filter((m) => m.status === 'active').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Active Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Shield className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers.filter((m) => m.role === 'admin').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-info/10 rounded-lg">
                    <FileText className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {teamMembers.reduce((acc, m) => acc + m.documentsAccessed, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Documents Accessed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage user access and permissions</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={member.role}
                          onValueChange={(v) => handleRoleChange(member.id, v as any)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        {member.lastActive
                          ? format(new Date(member.lastActive), 'MMM d, h:mm a')
                          : '-'}
                      </TableCell>
                      <TableCell>{member.documentsAccessed}</TableCell>
                      <TableCell>
                        {member.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(member.id, 'suspended')}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Suspend
                          </Button>
                        ) : member.status === 'suspended' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(member.id, 'active')}
                          >
                            Activate
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pending...</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Role Permissions
              </CardTitle>
              <CardDescription>
                Overview of access levels for each role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permission</TableHead>
                    <TableHead className="text-center">Viewer</TableHead>
                    <TableHead className="text-center">Editor</TableHead>
                    <TableHead className="text-center">Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'View documents', viewer: true, editor: true, admin: true },
                    { name: 'Upload documents', viewer: false, editor: true, admin: true },
                    { name: 'Edit documents', viewer: false, editor: true, admin: true },
                    { name: 'Delete documents', viewer: false, editor: false, admin: true },
                    { name: 'Export reports', viewer: true, editor: true, admin: true },
                    { name: 'Manage team', viewer: false, editor: false, admin: true },
                    { name: 'Billing access', viewer: false, editor: false, admin: true },
                  ].map((perm) => (
                    <TableRow key={perm.name}>
                      <TableCell>{perm.name}</TableCell>
                      <TableCell className="text-center">
                        {perm.viewer ? '✓' : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {perm.editor ? '✓' : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {perm.admin ? '✓' : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
