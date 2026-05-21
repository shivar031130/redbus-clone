-- Admin RLS Policies: Allow admins full read access to all tables
-- This migration adds admin bypass policies using a helper function

-- Helper: Check if current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles: Admin can read all
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- Profiles: Admin can update any profile (e.g., role changes)
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Profiles: Admin can delete any profile
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (is_admin());

-- Operators: Admin can update status
CREATE POLICY "Admins can update operators"
  ON operators FOR UPDATE
  USING (is_admin());

-- Bookings: Admin can read all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (is_admin());

-- Bookings: Admin can update booking status
CREATE POLICY "Admins can update bookings"
  ON bookings FOR UPDATE
  USING (is_admin());

-- Payments: Admin can read all payments
CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  USING (is_admin());

-- Schedules: Admin read (already public, but being explicit)
-- Routes: Admin read (already public)

-- Booking Passengers: Admin can read all
CREATE POLICY "Admins can view booking passengers"
  ON booking_passengers FOR SELECT
  USING (is_admin());
