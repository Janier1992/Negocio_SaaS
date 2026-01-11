-- ==============================================================================
-- MIGRATION 17: NUCLEAR RLS FIX - REMOVING HIDDEN RECURSION
-- ==============================================================================
-- We identified a hidden policy "Tenant Read Members" that causes infinite recursion.
-- We must DROP IT explicitly.

-- 1. DROP THE TOXIC POLICIES (Identified via pg_policies)
DROP POLICY IF EXISTS "Tenant Read Members" ON public.business_members;
DROP POLICY IF EXISTS "Tenant Insert Self" ON public.business_members;

-- 2. Ensure Clean Slate (Drop our previous ones too just to be clean, then re-add single truth)
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.business_members;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.business_members;

-- 3. RE-CREATE THE SAFE POLICIES (Non-recursive)
CREATE POLICY "Users can view their own memberships" 
ON public.business_members FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own membership" 
ON public.business_members FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Audit Log (Optional verify)
DO $$
BEGIN
    RAISE NOTICE 'Toxic policies dropped. RLS for business_members should now be safe.';
END $$;
