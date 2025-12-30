-- Create support messages table for user-admin communication
CREATE TABLE public.support_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    recipient_id UUID,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    is_from_admin BOOLEAN NOT NULL DEFAULT false,
    is_read BOOLEAN NOT NULL DEFAULT false,
    parent_id UUID REFERENCES public.support_messages(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages (sent or received)
CREATE POLICY "Users can view their messages"
ON public.support_messages
FOR SELECT
USING (
    auth.uid() = sender_id 
    OR auth.uid() = recipient_id
    OR public.has_role(auth.uid(), 'admin')
);

-- Users can send messages
CREATE POLICY "Users can send messages"
ON public.support_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update their messages"
ON public.support_messages
FOR UPDATE
USING (
    auth.uid() = sender_id 
    OR auth.uid() = recipient_id
    OR public.has_role(auth.uid(), 'admin')
);

-- Admins can delete messages
CREATE POLICY "Admins can delete messages"
ON public.support_messages
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_support_messages_updated_at
BEFORE UPDATE ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;