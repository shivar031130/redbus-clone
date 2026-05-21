-- Operator RLS Policies: Operators can manage their own data

-- Helper: Get the operator ID for the current user
CREATE OR REPLACE FUNCTION my_operator_id()
RETURNS UUID AS $$
  SELECT id FROM operators WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Buses: Operators can view/insert/update/delete their own buses
CREATE POLICY "Operators can view own buses"
  ON buses FOR SELECT
  USING (operator_id = my_operator_id());

CREATE POLICY "Operators can insert own buses"
  ON buses FOR INSERT
  WITH CHECK (operator_id = my_operator_id());

CREATE POLICY "Operators can update own buses"
  ON buses FOR UPDATE
  USING (operator_id = my_operator_id());

CREATE POLICY "Operators can delete own buses"
  ON buses FOR DELETE
  USING (operator_id = my_operator_id());

-- Routes: Operators can manage their own routes
CREATE POLICY "Operators can manage own routes"
  ON routes FOR ALL
  USING (operator_id = my_operator_id())
  WITH CHECK (operator_id = my_operator_id());

-- Schedules: Operators can manage schedules for their routes
CREATE POLICY "Operators can view own schedules"
  ON schedules FOR SELECT
  USING (route_id IN (SELECT id FROM routes WHERE operator_id = my_operator_id()));

CREATE POLICY "Operators can insert own schedules"
  ON schedules FOR INSERT
  WITH CHECK (route_id IN (SELECT id FROM routes WHERE operator_id = my_operator_id()));

CREATE POLICY "Operators can update own schedules"
  ON schedules FOR UPDATE
  USING (route_id IN (SELECT id FROM routes WHERE operator_id = my_operator_id()));

-- Bookings: Operators can view bookings for their schedules
CREATE POLICY "Operators can view own bookings"
  ON bookings FOR SELECT
  USING (
    schedule_id IN (
      SELECT s.id FROM schedules s
      JOIN routes r ON r.id = s.route_id
      WHERE r.operator_id = my_operator_id()
    )
  );

-- Booking Passengers: Operators can view passengers for their bookings
CREATE POLICY "Operators can view own booking passengers"
  ON booking_passengers FOR SELECT
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN schedules s ON s.id = b.schedule_id
      JOIN routes r ON r.id = s.route_id
      WHERE r.operator_id = my_operator_id()
    )
  );

-- Seats: Operators can view seats for their buses
CREATE POLICY "Operators can view own seats"
  ON seats FOR SELECT
  USING (bus_id IN (SELECT id FROM buses WHERE operator_id = my_operator_id()));
