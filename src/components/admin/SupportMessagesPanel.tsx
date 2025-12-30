import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useSupportMessageReplies } from '@/hooks/useAdminData';
import {
  MessageSquare, Send, Clock, CheckCircle, AlertCircle,
  User, Mail, Search, Filter, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

interface SupportMessage {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  is_from_admin: boolean;
  is_read: boolean;
  parent_id: string | null;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessagesPanelProps {
  messages: SupportMessage[] | undefined;
  isLoading: boolean;
  currentUserId: string;
}

export const SupportMessagesPanel = ({ messages, isLoading, currentUserId }: SupportMessagesPanelProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSending, setIsSending] = useState(false);

  const { data: replies } = useSupportMessageReplies(selectedMessage?.id || null);

  const filteredMessages = messages?.filter(msg => {
    const matchesSearch = msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || msg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        sender_id: currentUserId,
        recipient_id: selectedMessage.sender_id,
        subject: `Re: ${selectedMessage.subject}`,
        content: replyContent,
        is_from_admin: true,
        parent_id: selectedMessage.id,
        status: 'replied',
        priority: selectedMessage.priority,
      });

      if (error) throw error;

      // Update original message status
      await supabase
        .from('support_messages')
        .update({ status: 'replied', is_read: true })
        .eq('id', selectedMessage.id);

      toast({ title: 'Reply sent successfully' });
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['support_messages_admin'] });
      queryClient.invalidateQueries({ queryKey: ['support_replies', selectedMessage.id] });
    } catch (error) {
      toast({
        title: 'Error sending reply',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (messageId: string, newStatus: string) => {
    try {
      await supabase
        .from('support_messages')
        .update({ status: newStatus })
        .eq('id', messageId);

      toast({ title: `Ticket marked as ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ['support_messages_admin'] });
    } catch (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'normal': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4 text-warning" />;
      case 'replied': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Support Messages
              </CardTitle>
              <CardDescription>
                {messages?.filter(m => !m.is_read && !m.is_from_admin).length || 0} unread messages
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['support_messages_admin'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages List */}
          <ScrollArea className="h-[400px]">
            {filteredMessages && filteredMessages.length > 0 ? (
              <div className="space-y-3">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                      !message.is_read && !message.is_from_admin ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    }`}
                    onClick={() => setSelectedMessage(message)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(message.status)}
                          <span className="font-medium truncate">{message.subject}</span>
                          {!message.is_read && !message.is_from_admin && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{message.sender_id.slice(0, 8)}...</span>
                          <span>•</span>
                          <span>{format(new Date(message.created_at), 'MMM d, h:mm a')}</span>
                        </div>
                      </div>
                      <Badge variant={getPriorityColor(message.priority) as any}>
                        {message.priority}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                <Mail className="h-12 w-12 mb-4 opacity-50" />
                <p>No support messages</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getStatusIcon(selectedMessage?.status || '')}
              {selectedMessage?.subject}
            </DialogTitle>
            <DialogDescription>
              From user {selectedMessage?.sender_id.slice(0, 8)}... • 
              {selectedMessage && format(new Date(selectedMessage.created_at), 'MMM d, yyyy h:mm a')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Original Message */}
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm whitespace-pre-wrap">{selectedMessage?.content}</p>
            </div>

            {/* Replies */}
            {replies && replies.length > 0 && (
              <ScrollArea className="flex-1 max-h-[200px]">
                <div className="space-y-3">
                  <Separator />
                  <p className="text-sm font-medium text-muted-foreground">Conversation History</p>
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg ${
                        reply.is_from_admin ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                        {reply.is_from_admin ? 'Admin' : 'User'}
                        <span>•</span>
                        {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                      </div>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Reply Form */}
            <div className="space-y-3">
              <Separator />
              <Textarea
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => selectedMessage && handleUpdateStatus(selectedMessage.id, 'closed')}
                  >
                    Close Ticket
                  </Button>
                </div>
                <Button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || isSending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Reply'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};