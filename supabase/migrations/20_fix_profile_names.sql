-- Add first_name and last_name columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Migrate existing data (simple split)
UPDATE public.profiles
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 1))
WHERE first_name IS NULL AND full_name IS NOT NULL;

-- Update Trigger to handle new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  v_full_name := new.raw_user_meta_data->>'full_name';
  
  -- Simple heuristic for splitting names
  v_first_name := SPLIT_PART(v_full_name, ' ', 1);
  v_last_name := TRIM(SUBSTRING(v_full_name FROM LENGTH(SPLIT_PART(v_full_name, ' ', 1)) + 1));

  INSERT INTO public.profiles (id, email, full_name, first_name, last_name)
  VALUES (new.id, new.email, v_full_name, v_first_name, v_last_name)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
    last_name = COALESCE(public.profiles.last_name, EXCLUDED.last_name);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
