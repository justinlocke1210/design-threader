
-- Create design_images table for storing image references
CREATE TABLE public.design_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  design_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow all operations (no auth in this app yet)
ALTER TABLE public.design_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read access to design_images"
  ON public.design_images FOR SELECT
  USING (true);

CREATE POLICY "Allow all insert access to design_images"
  ON public.design_images FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all delete access to design_images"
  ON public.design_images FOR DELETE
  USING (true);

-- Create storage bucket for design images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('design-images', 'design-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- Storage policies
CREATE POLICY "Allow public read of design images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-images');

CREATE POLICY "Allow public upload of design images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'design-images');

CREATE POLICY "Allow public delete of design images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'design-images');
