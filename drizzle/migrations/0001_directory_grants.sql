GRANT SELECT, INSERT, UPDATE, DELETE ON public.directory_clinics, public.directory_cities, public.directory_regions TO authenticated;
GRANT SELECT ON public.directory_clinics, public.directory_cities, public.directory_regions TO anon;
GRANT ALL ON public.directory_clinics, public.directory_cities, public.directory_regions TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;