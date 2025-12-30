import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserSupportMessages, useSupportMessageReplies } from '@/hooks/useAdminData';
import { useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle, Send, Plus, Clock, CheckCircle,
  AlertCircle, ChevronRight, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface SupportChatProps {
  userId: string;
}

interface SupportMessage {
  id: string;
  subject: string;
  content: string;
  status: string;
  priority: string;
  created_at: string;
  is_from_admin: boolean;
  is_read: boolean;
  parent_id: string | null;
}

export const SupportChat = ({ userId }: SupportChatProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportMessage | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', content: '', priority: 'normal' });
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { data: messages, refetch } = useUserSupportMessages(userId);
  const { data: replies } = useSupportMessageReplies(selectedTicket?.id || null);

  // Get only parent messages (tickets)
  const tickets = messages?.filter(m => !m.parent_id) || [];
  const unreadCount = messages?.filter(m => !m.is_read && m.is_from_admin).length || 0;

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('support-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_messages',
        },
        () => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ['support_replies'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, queryClient]);

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.content.trim()) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        sender_id: userId,
        subject: newTicket.subject,
        content: newTicket.content,
        priority: newTicket.priority,
        is_from_admin: false,
        status: 'open',
      });

      if (error) throw error;

      toast({ title: 'Support ticket created successfully' });
      setNewTicket({ subject: '', content: '', priority: 'normal' });
      setShowNewTicket(false);
      refetch();
    } catch (error) {
      toast({
        title: 'Error creating ticket',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyContent.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        sender_id: userId,
        subject: `Re: ${selectedTicket.subject}`,
        content: replyContent,
        is_from_admin: false,
        parent_id: selectedTicket.id,
        status: 'open',
        priority: selectedTicket.priority,
      });

      if (error) throw error;

      toast({ title: 'Reply sent' });
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['support_replies', selectedTicket.id] });
      refetch();
    } catch (error) {
      toast({ title: 'Error sending reply', variant: 'destructive' });
    } finally {
      setIsSending(false);
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <HelpCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Support Center
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* New Ticket Form */}
          {showNewTicket && !selectedTicket && (
            <div className="p-4 border-b bg-muted/30">
              <div className="space-y-3">
                <Input
                  placeholder="Subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
                <Textarea
                  placeholder="Describe your issue..."
                  value={newTicket.content}
                  onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })}
                  rows={4}
                />
                <Select
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low Priority</SelectItem>
                    <SelectItem value="normal">Normal Priority</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowNewTicket(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateTicket}
                    disabled={isSending}
                  >
                    {isSending ? 'Sending...' : 'Submit'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ticket Detail View */}
          {selectedTicket && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTicket(null)}
                  className="mb-2"
                >
                  ← Back to tickets
                </Button>
                <h3 className="font-medium">{selectedTicket.subject}</h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {getStatusIcon(selectedTicket.status)}
                  <span className="capitalize">{selectedTicket.status}</span>
                  <span>•</span>
                  <span>{format(new Date(selectedTicket.created_at), 'MMM d')}</span>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {/* Original message */}
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-xs text-muted-foreground mb-1">You</p>
                    <p className="text-sm">{selectedTicket.content}</p>
                  </div>

                  {/* Replies */}
                  {replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-3 rounded-lg ${
                        reply.is_from_admin ? 'bg-primary/10 ml-4' : 'bg-muted mr-4'
                      }`}
                    >
                      <p className="text-xs text-muted-foreground mb-1">
                        {reply.is_from_admin ? 'Support Team' : 'You'}
                      </p>
                      <p className="text-sm">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                    />
                    <Button onClick={handleSendReply} disabled={isSending || !replyContent.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tickets List */}
          {!selectedTicket && !showNewTicket && (
            <>
              <div className="p-4 border-b">
                <Button className="w-full" onClick={() => setShowNewTicket(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Support Ticket
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {tickets.length > 0 ? (
                    tickets.map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(ticket.status)}
                                <span className="font-medium text-sm truncate">
                                  {ticket.subject}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {ticket.content}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No support tickets yet</p>
                      <p className="text-sm">Create one to get help</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};