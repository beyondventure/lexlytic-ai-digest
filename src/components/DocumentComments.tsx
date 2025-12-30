import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MessageSquare, Send, Trash2, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
}

interface DocumentCommentsProps {
  documentId: string;
  userId: string;
}

export function DocumentComments({ documentId, userId }: DocumentCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // For demo purposes, we'll use local state since we don't have a comments table yet
  // In production, this would fetch from Supabase
  useEffect(() => {
    // Load comments from localStorage for demo
    const savedComments = localStorage.getItem(`doc-comments-${documentId}`);
    if (savedComments) {
      setComments(JSON.parse(savedComments));
    }
  }, [documentId]);

  const saveComments = (updatedComments: Comment[]) => {
    localStorage.setItem(`doc-comments-${documentId}`, JSON.stringify(updatedComments));
    setComments(updatedComments);
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const comment: Comment = {
        id: crypto.randomUUID(),
        content: newComment,
        user_id: userId,
        created_at: new Date().toISOString(),
        user_name: 'You',
      };

      const updatedComments = [...comments, comment];
      saveComments(updatedComments);
      setNewComment('');
      
      toast({
        title: 'Comment added',
        description: 'Your comment has been saved.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add comment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (commentId: string) => {
    const updatedComments = comments.filter(c => c.id !== commentId);
    saveComments(updatedComments);
    toast({
      title: 'Comment deleted',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-accent" />
          Comments & Annotations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comment input */}
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment or annotation..."
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              Add Comment
            </Button>
          </div>
        </div>

        {/* Comments list */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No comments yet. Be the first to add one!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3 bg-muted/50 rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {comment.user_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">{comment.user_name || 'User'}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  {comment.user_id === userId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-foreground pl-8">{comment.content}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
