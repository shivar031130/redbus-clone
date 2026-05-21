-- Add interior and exterior image columns to buses
ALTER TABLE public.buses 
ADD COLUMN interior_image_url text,
ADD COLUMN exterior_image_url text;

-- Create Storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bus-images', 'bus-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for bus-images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'bus-images');
CREATE POLICY "Authenticated users can upload bus images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bus-images');
CREATE POLICY "Operators can update their bus images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'bus-images');
CREATE POLICY "Operators can delete their bus images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bus-images');

-- Storage RLS Policies for avatars
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Users can update their avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Users can delete their avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars');
