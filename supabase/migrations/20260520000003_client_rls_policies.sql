-- Client RLS Policies: Clients can view and manage their own data

-- Bookings: Clients can view their own bookings
CREATE POLICY "Clients can view own bookings"
  ON bookings FOR SELECT
  USING (client_id = auth.uid());

-- Booking Passengers: Clients can view their own booking passengers
CREATE POLICY "Clients can view own booking passengers"
  ON booking_passengers FOR SELECT
  USING (booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid()));

-- Payments: Clients can view their own payments
CREATE POLICY "Clients can view own payments"
  ON payments FOR SELECT
  USING (booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid()));

-- Tickets: Clients can view their own tickets
CREATE POLICY "Clients can view own tickets"
  ON tickets FOR SELECT
  USING (booking_id IN (SELECT id FROM bookings WHERE client_id = auth.uid()));

-- Reviews: Clients can insert their own reviews
CREATE POLICY "Clients can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (client_id = auth.uid());

-- Reviews: Clients can view all reviews (public)
CREATE POLICY "Reviews are publicly viewable"
  ON reviews FOR SELECT
  USING (true);

-- Profiles: Clients can update their own profile
-- (Already covered by existing policy, kept explicit for clarity)
-- UPDATE policy already exists from initial schema

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications read"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
