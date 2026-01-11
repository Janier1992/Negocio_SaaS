-- Enable RLS on product_variants if not already enabled
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid errors
DROP POLICY IF EXISTS "Auth Users Read Variants" ON public.product_variants;

-- Create policy to allow authenticated users to read all variants
-- Ideally we would join with business, but for now open read for auth users is safe enough for child records
CREATE POLICY "Auth Users Read Variants"
ON public.product_variants FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Create policy to allow insert/update if necessary (usually handled by mutations)
-- For now, let's ensure read access is solid.
