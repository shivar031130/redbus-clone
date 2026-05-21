-- Realtime features: chat, live seat metrics, schedule updates, and bus tracking

-- Extend schedules with live ETA/status fields
ALTER TABLE public.schedules
  ADD COLUMN IF NOT EXISTS estimated_departure_time timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_arrival_time timestamptz,
  ADD COLUMN IF NOT EXISTS delay_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS live_status text DEFAULT 'scheduled',
  ADD COLUMN IF NOT EXISTS last_update_at timestamptz;

-- Schedule metrics (live seat occupancy)
CREATE TABLE IF NOT EXISTS public.schedule_metrics (
  schedule_id uuid PRIMARY KEY REFERENCES public.schedules(id) ON DELETE CASCADE,
  total_seats integer NOT NULL DEFAULT 0,
  booked_seats integer NOT NULL DEFAULT 0,
  locked_seats integer NOT NULL DEFAULT 0,
  available_seats integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Schedule updates (ETA/delay/status)
CREATE TABLE IF NOT EXISTS public.schedule_updates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE CASCADE,
  status text NOT NULL,
  message text,
  estimated_departure_time timestamptz,
  estimated_arrival_time timestamptz,
  delay_minutes integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS schedule_updates_schedule_id_idx
  ON public.schedule_updates(schedule_id, created_at DESC);

-- Live bus locations
CREATE TABLE IF NOT EXISTS public.bus_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id uuid REFERENCES public.schedules(id) ON DELETE CASCADE,
  bus_id uuid REFERENCES public.buses(id) ON DELETE SET NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  heading integer,
  speed_kmh double precision,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bus_locations_schedule_id_idx
  ON public.bus_locations(schedule_id, recorded_at DESC);

-- Chat threads and messages
CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id uuid UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  operator_id uuid REFERENCES public.operators(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id uuid REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_thread_id_idx
  ON public.chat_messages(thread_id, created_at ASC);

-- Enable RLS for new tables
ALTER TABLE public.schedule_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: is operator for schedule
CREATE OR REPLACE FUNCTION public.is_operator_for_schedule(p_schedule uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.schedules s
    JOIN public.routes r ON r.id = s.route_id
    WHERE s.id = p_schedule
      AND r.operator_id = public.my_operator_id()
  );
$$;

-- Helper: is client for schedule (has booking)
CREATE OR REPLACE FUNCTION public.is_client_for_schedule(p_schedule uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.schedule_id = p_schedule
      AND b.client_id = auth.uid()
  );
$$;

-- Helper: refresh schedule metrics
CREATE OR REPLACE FUNCTION public.refresh_schedule_metrics(p_schedule uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_total integer;
  v_booked integer;
  v_locked integer;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'booked'),
    count(*) FILTER (WHERE status = 'locked')
  INTO v_total, v_booked, v_locked
  FROM public.seats
  WHERE schedule_id = p_schedule;

  INSERT INTO public.schedule_metrics (schedule_id, total_seats, booked_seats, locked_seats, available_seats, updated_at)
  VALUES (p_schedule, v_total, v_booked, v_locked, GREATEST(v_total - v_booked - v_locked, 0), now())
  ON CONFLICT (schedule_id)
  DO UPDATE SET
    total_seats = EXCLUDED.total_seats,
    booked_seats = EXCLUDED.booked_seats,
    locked_seats = EXCLUDED.locked_seats,
    available_seats = EXCLUDED.available_seats,
    updated_at = now();
END;
$$;

-- Trigger: update metrics when seats change
CREATE OR REPLACE FUNCTION public.handle_seat_metrics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM public.refresh_schedule_metrics(NEW.schedule_id);
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.schedule_id <> OLD.schedule_id THEN
    PERFORM public.refresh_schedule_metrics(OLD.schedule_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_schedule_metrics(OLD.schedule_id);
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS seats_metrics_trigger ON public.seats;
CREATE TRIGGER seats_metrics_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.seats
FOR EACH ROW EXECUTE FUNCTION public.handle_seat_metrics();

-- Trigger: create chat thread when booking is created
CREATE OR REPLACE FUNCTION public.create_chat_thread_for_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_operator_id uuid;
BEGIN
  SELECT r.operator_id
  INTO v_operator_id
  FROM public.schedules s
  JOIN public.routes r ON r.id = s.route_id
  WHERE s.id = NEW.schedule_id;

  INSERT INTO public.chat_threads (booking_id, client_id, operator_id)
  VALUES (NEW.id, NEW.client_id, v_operator_id)
  ON CONFLICT (booking_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_chat_thread_on_booking ON public.bookings;
CREATE TRIGGER create_chat_thread_on_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_chat_thread_for_booking();

-- Trigger: touch chat thread on new message
CREATE OR REPLACE FUNCTION public.touch_chat_thread()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE public.chat_threads
  SET updated_at = now()
  WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS chat_thread_touch_trigger ON public.chat_messages;
CREATE TRIGGER chat_thread_touch_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_chat_thread();

-- RLS Policies

-- Schedule metrics: public read
DROP POLICY IF EXISTS "Schedule metrics are viewable by everyone" ON public.schedule_metrics;
CREATE POLICY "Schedule metrics are viewable by everyone"
  ON public.schedule_metrics FOR SELECT
  USING (true);

-- Schedule updates: public read, operators/admin can insert
DROP POLICY IF EXISTS "Schedule updates are viewable by everyone" ON public.schedule_updates;
CREATE POLICY "Schedule updates are viewable by everyone"
  ON public.schedule_updates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Operators can insert schedule updates" ON public.schedule_updates;
CREATE POLICY "Operators can insert schedule updates"
  ON public.schedule_updates FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_operator_for_schedule(schedule_id));

-- Bus locations: participants can view, operators/admin can insert
DROP POLICY IF EXISTS "Bus locations are viewable by participants" ON public.bus_locations;
CREATE POLICY "Bus locations are viewable by participants"
  ON public.bus_locations FOR SELECT
  USING (
    public.is_admin()
    OR public.is_operator_for_schedule(schedule_id)
    OR public.is_client_for_schedule(schedule_id)
  );

DROP POLICY IF EXISTS "Operators can insert bus locations" ON public.bus_locations;
CREATE POLICY "Operators can insert bus locations"
  ON public.bus_locations FOR INSERT
  WITH CHECK (public.is_admin() OR public.is_operator_for_schedule(schedule_id));

-- Chat threads: participants can view, client/operator can create (fallback)
DROP POLICY IF EXISTS "Chat threads are viewable by participants" ON public.chat_threads;
CREATE POLICY "Chat threads are viewable by participants"
  ON public.chat_threads FOR SELECT
  USING (
    public.is_admin()
    OR client_id = auth.uid()
    OR operator_id = public.my_operator_id()
  );

DROP POLICY IF EXISTS "Participants can create chat threads" ON public.chat_threads;
CREATE POLICY "Participants can create chat threads"
  ON public.chat_threads FOR INSERT
  WITH CHECK (
    client_id = auth.uid()
    OR operator_id = public.my_operator_id()
  );

-- Chat messages: participants can view and send
DROP POLICY IF EXISTS "Chat messages are viewable by participants" ON public.chat_messages;
CREATE POLICY "Chat messages are viewable by participants"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (
          public.is_admin()
          OR t.client_id = auth.uid()
          OR t.operator_id = public.my_operator_id()
        )
    )
  );

DROP POLICY IF EXISTS "Participants can send chat messages" ON public.chat_messages;
CREATE POLICY "Participants can send chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id
        AND (
          public.is_admin()
          OR t.client_id = auth.uid()
          OR t.operator_id = public.my_operator_id()
        )
    )
  );

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bus_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
