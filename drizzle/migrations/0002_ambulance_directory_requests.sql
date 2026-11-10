ALTER TABLE public.directory_clinics ADD COLUMN IF NOT EXISTS working_hours text, ADD COLUMN IF NOT EXISTS whatsapp text;

CREATE TABLE public.ambulance_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid NOT NULL REFERENCES public.directory_cities(id),
  region_id uuid REFERENCES public.directory_regions(id) ON DELETE SET NULL,
  address text,
  phones text[] NOT NULL DEFAULT '{}',
  whatsapp text,
  website text,
  coverage text[] NOT NULL DEFAULT '{}',
  vehicle_types text[] NOT NULL DEFAULT '{}',
  services text[] NOT NULL DEFAULT '{}',
  latitude double precision,
  longitude double precision,
  coordinate_source_url text,
  source_urls text[] NOT NULL DEFAULT '{}',
  verification text NOT NULL DEFAULT 'pending' CHECK (verification IN ('pending','verified')),
  availability_confirmed boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ambulance_companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ambulance_companies TO authenticated;
GRANT ALL ON public.ambulance_companies TO service_role;
ALTER TABLE public.ambulance_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY read_published_companies ON public.ambulance_companies FOR SELECT TO anon, authenticated USING (published);
CREATE POLICY admin_companies ON public.ambulance_companies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.ambulance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_name text NOT NULL CHECK (char_length(requester_name) BETWEEN 2 AND 120),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 7 AND 20),
  pickup text NOT NULL CHECK (char_length(pickup) BETWEEN 3 AND 500),
  destination text NOT NULL CHECK (char_length(destination) BETWEEN 2 AND 500),
  city text NOT NULL CHECK (char_length(city) BETWEEN 2 AND 100),
  region text CHECK (char_length(region) <= 100),
  transport_type text NOT NULL CHECK (char_length(transport_type) BETWEEN 2 AND 100),
  company_id uuid REFERENCES public.ambulance_companies(id) ON DELETE SET NULL,
  notes text CHECK (char_length(notes) <= 1000),
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','assigned','done','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.ambulance_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.ambulance_requests TO authenticated;
GRANT ALL ON public.ambulance_requests TO service_role;
ALTER TABLE public.ambulance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY submit_requests ON public.ambulance_requests FOR INSERT TO anon, authenticated WITH CHECK (status = 'new');
CREATE POLICY admin_read_requests ON public.ambulance_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY admin_update_requests ON public.ambulance_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));