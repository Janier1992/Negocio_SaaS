-- ==============================================================================
-- 08 SECURITY HARDENING (MULTI-TENANT ISOLATION)
-- ==============================================================================
-- FIX CRITICAL VULNERABILITY: 
-- Previous policies allowed any auth user to see all data.
-- New policies restrict access only to the user's own business data.

-- Helper function to optimize RLS (avoid repetitive subqueries if possible, but PG optimizes well)
-- For now, we use direct subqueries for transparency.

-- 1. BUSINESSES
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Users All Access" ON public.businesses;

-- Allow reading ONLY your own businesses
CREATE POLICY "Tenant Read Own Business" ON public.businesses
FOR SELECT USING (
  id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

-- Allow creating a business (Any auth user can register a business)
CREATE POLICY "Tenant Create Business" ON public.businesses
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow update only own business
CREATE POLICY "Tenant Update Own Business" ON public.businesses
FOR UPDATE USING (
  id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

-- 2. BUSINESS MEMBERS
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Users All Access" ON public.business_members;

CREATE POLICY "Tenant Read Members" ON public.business_members
FOR SELECT USING (
  user_id = auth.uid() 
  OR 
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

CREATE POLICY "Tenant Insert Self" ON public.business_members
FOR INSERT WITH CHECK (user_id = auth.uid());


-- 3. PRODUCTS & VARIANTS
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Users All Access" ON public.products;
CREATE POLICY "Tenant Isolation Products" ON public.products
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Auth Users All Access" ON public.product_variants;
CREATE POLICY "Tenant Isolation Variants" ON public.product_variants
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

-- 4. SALES & ITEMS
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Users All Access" ON public.sales;
CREATE POLICY "Tenant Isolation Sales" ON public.sales
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Auth Users All Access" ON public.sale_items;
CREATE POLICY "Tenant Isolation SaleItems" ON public.sale_items
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

-- 5. CUSTOMERS & SUPPLIERS
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Users All Access" ON public.customers;
CREATE POLICY "Tenant Isolation Customers" ON public.customers
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Auth Users All Access" ON public.suppliers;
CREATE POLICY "Tenant Isolation Suppliers" ON public.suppliers
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

-- 6. CATEGORIES & EXPENSES & ALERTS
-------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Auth Users All Access" ON public.categories;
CREATE POLICY "Tenant Isolation Categories" ON public.categories
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Auth Users All Access" ON public.expenses;
CREATE POLICY "Tenant Isolation Expenses" ON public.expenses
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Auth Users All Access" ON public.alerts;
CREATE POLICY "Tenant Isolation Alerts" ON public.alerts
FOR ALL USING (
  business_id IN (SELECT business_id FROM public.business_members WHERE user_id = auth.uid())
);
