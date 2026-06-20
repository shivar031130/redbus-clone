'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

interface ChatMessage {
  id: string;
  sender_id: string | null;
  body: string;
  created_at: string;
}

interface ChatThread {
  id: string;
  client_id: string;
  operator_id: string;
}

interface ChatPanelProps {
  bookingId: string;
  className?: string;
}

export function ChatPanel({ bookingId, className }: ChatPanelProps) {
  const { user, isLoading } = useAuthStore();
  const supabase = useMemo(() => createClient(), []);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [passengerName, setPassengerName] = useState<string>('Passenger');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!bookingId || isLoading || !user) return;

    let isMounted = true;

    const findOrCreateThread = async (): Promise<ChatThread> => {
      const { data: existing, error } = await supabase
        .from('chat_threads')
        .select('id, client_id, operator_id')
        .eq('booking_id', bookingId)
        .maybeSingle();
      if (error) throw error;
      if (existing) return existing as ChatThread;

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('client_id, schedules(routes(operator_id))')
        .eq('id', bookingId)
        .single();
      if (bookingError) throw bookingError;

      const operatorId = (booking as any)?.schedules?.routes?.operator_id;
      const clientId = booking?.client_id;
      if (!operatorId || !clientId) {
        throw new Error('Chat thread could not be initialized.');
      }

      const { data: created, error: createError } = await supabase
        .from('chat_threads')
        .insert({ booking_id: bookingId, client_id: clientId, operator_id: operatorId })
        .select('id, client_id, operator_id')
        .single();
      if (createError) throw createError;
      return created as ChatThread;
    };

    const loadMessageHistory = async (threadId: string): Promise<ChatMessage[]> => {
      const { data, error: historyError } = await supabase
        .from('chat_messages')
        .select('id, sender_id, body, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (historyError) throw historyError;
      return (data ?? []) as ChatMessage[];
    };

    const loadThread = async () => {
      setLoading(true);
      try {
        const resolvedThread = await findOrCreateThread();
        if (!isMounted) return;
        setThread(resolvedThread);

        const history = await loadMessageHistory(resolvedThread.id);
        if (!isMounted) return;
        setMessages(history);

        // Fetch passenger name
        let resolvedPassengerName = 'Passenger';
        const { data: passengers, error: passengersError } = await supabase
          .from('booking_passengers')
          .select('passenger_name')
          .eq('booking_id', bookingId)
          .limit(1);

        if (!isMounted) return;

        if (!passengersError && passengers && passengers.length > 0) {
          resolvedPassengerName = passengers[0].passenger_name;
        } else {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', resolvedThread.client_id)
            .single();
          if (!isMounted) return;
          if (profileData) {
            resolvedPassengerName = profileData.full_name || profileData.email.split('@')[0] || 'Passenger';
          }
        }
        if (isMounted) {
          setPassengerName(resolvedPassengerName);
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.message || 'Failed to load chat.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadThread();

    return () => {
      isMounted = false;
    };
  }, [bookingId, isLoading, supabase, user]);

  useEffect(() => {
    if (!thread) 
      return;

    const channel = supabase
      .channel(`chat_thread_${thread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          const next = payload.new as ChatMessage;
          setMessages((current) => {
            if (current.some((m) => m.id === next.id)) return current;
            return [...current, next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, thread]);

  const handleSend = async () => {
    if (!draft.trim() || !user || !thread) return;
    setSending(true);
    try {
      const payload = {
        thread_id: thread.id,
        sender_id: user.id,
        body: draft.trim(),
      };
      const { error } = await supabase.from('chat_messages').insert(payload);
      if (error) throw error;
      setDraft('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  if (isLoading || !user) {
    return (
      <Card className={cn('p-6 text-sm text-muted-foreground', className)}>
        Please sign in to start a live chat with the operator.
      </Card>
    );
  }

  return (
    <Card className={cn('flex flex-col gap-4 p-5', className)}>
      <div>
        <h3 className="text-lg font-semibold">Realtime Support Chat</h3>
        <p className="text-sm text-muted-foreground">Chat directly with your operator team.</p>
      </div>

      <div
        ref={listRef}
        className="h-64 overflow-y-auto rounded-xl border border-border bg-secondary/20 p-4 space-y-3"
      >
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
        ) : (
          messages.map((message) => {
            const isMine = message.sender_id === user.id;
            const isClientSender = thread ? message.sender_id === thread.client_id : false;
            const label = isClientSender
              ? (isMine ? 'You' : passengerName)
              : 'Operator';
            return (
              <div
                key={message.id}
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm',
                  isMine
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-white border border-border'
                )}
              >
                <div className="text-[10px] uppercase tracking-wider opacity-70 mb-1">
                  {label}
                </div>
                <div>{message.body}</div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={sending || !draft.trim()} className="gap-2">
          <Send className="h-4 w-4" />
          Send
        </Button>
      </div>
    </Card>
  );
}
