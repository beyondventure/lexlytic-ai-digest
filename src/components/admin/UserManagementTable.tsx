import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Search, Users, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  profile: {
    full_name: string | null;
    company: string | null;
  } | null;
  role: string;
}

interface UserManagementTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}

export const UserManagementTable = ({ users, isLoading, onRefresh }: UserManagementTableProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users?.filter(
    (u) =>
      u.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.profile?.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.includes(searchQuery)
  );

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // This is a workaround since we can't update with enum directly
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }

      // Insert new role - note: this might fail if role enum doesn't match
      // We'll handle it gracefully
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as any });

      if (insertError) throw insertError;

      toast({ title: 'Role updated successfully' });
      onRefresh();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Failed to update role',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>;
      case 'editor':
        return <Badge className="bg-accent">Editor</Badge>;
      default:
        return <Badge variant="secondary">Viewer</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Management
            </CardTitle>
            <CardDescription>Manage user roles and permissions</CardDescription>
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
        {filteredUsers && filteredUsers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Change Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {(user.profile?.full_name || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.profile?.full_name || 'Unknown User'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {user.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.profile?.company || '-'}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(v) => handleRoleChange(user.id, v)}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
