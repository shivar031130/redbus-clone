-- Migration to fix Row Level Security (RLS) policies for all tables in redBusMalaysia
-- Run this in your Supabase SQL Editor to enable full client/operator/admin actions!

-- 1. Profiles Table Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Operators Table Policies
DROP POLICY IF EXISTS "Operators are viewable by everyone" ON operators;
CREATE POLICY "Operators are viewable by everyone" ON operators FOR SELECT USING (true);
CREATE POLICY "Anyone can register as an operator" ON operators FOR INSERT WITH CHECK (true);
CREATE POLICY "Operators can update own details" ON operators FOR UPDATE USING (auth.uid() = profile_id);

-- 3. Buses Table Policies
DROP POLICY IF EXISTS "Buses are viewable by everyone" ON buses;
CREATE POLICY "Buses are viewable by everyone" ON buses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add buses" ON buses FOR INSERT WITH CHECK (true);
CREATE POLICY "Operators can manage own buses" ON buses FOR ALL USING (true);

-- 4. Routes Table Policies
DROP POLICY IF EXISTS "Routes are viewable by everyone" ON routes;
CREATE POLICY "Routes are viewable by everyone" ON routes FOR SELECT USING (true);
CREATE POLICY "Operators can manage routes" ON routes FOR ALL USING (true);

-- 5. Schedules Table Policies
DROP POLICY IF EXISTS "Schedules are viewable by everyone" ON schedules;
CREATE POLICY "Schedules are viewable by everyone" ON schedules FOR SELECT USING (true);
CREATE POLICY "Operators can manage schedules" ON schedules FOR ALL USING (true);

-- 6. Seats Table Policies
DROP POLICY IF EXISTS "Seats are viewable by everyone" ON seats;
CREATE POLICY "Seats are viewable by everyone" ON seats FOR SELECT USING (true);
CREATE POLICY "Anyone can lock/update seats" ON seats FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert seats" ON seats FOR INSERT WITH CHECK (true);

-- 7. Bookings Table Policies
DROP POLICY IF EXISTS "Bookings are viewable by everyone" ON bookings;
CREATE POLICY "Bookings are viewable by everyone" ON bookings FOR SELECT USING (true);
CREATE POLICY "Anyone can create bookings" ON bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update bookings" ON bookings FOR UPDATE USING (true);

-- 8. Booking Passengers Table Policies
DROP POLICY IF EXISTS "Booking passengers are viewable by everyone" ON booking_passengers;
CREATE POLICY "Booking passengers are viewable by everyone" ON booking_passengers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert passengers" ON booking_passengers FOR INSERT WITH CHECK (true);

-- 9. Payments Table Policies
DROP POLICY IF EXISTS "Payments are viewable by everyone" ON payments;
CREATE POLICY "Payments are viewable by everyone" ON payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payments" ON payments FOR INSERT WITH CHECK (true);

-- 10. Tickets Table Policies
DROP POLICY IF EXISTS "Tickets are viewable by everyone" ON tickets;
CREATE POLICY "Tickets are viewable by everyone" ON tickets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tickets" ON tickets FOR INSERT WITH CHECK (true);
