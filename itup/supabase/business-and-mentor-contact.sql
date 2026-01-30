-- Phase 2: Add contact_method to mentors
ALTER TABLE public.mentors ADD COLUMN IF NOT EXISTS contact_method text;

-- Phase 3: Create business_inquiries table
CREATE TABLE IF NOT EXISTS public.business_inquiries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  employee_count text,
  message text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an inquiry
CREATE POLICY "Anyone can insert" ON public.business_inquiries
  FOR INSERT WITH CHECK (true);

-- Only admins can view inquiries
CREATE POLICY "Admins can view" ON public.business_inquiries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
