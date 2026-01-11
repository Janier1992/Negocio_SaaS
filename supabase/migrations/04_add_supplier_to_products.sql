-- ==============================================================================
-- 04 ADD SUPPLIER_ID TO PRODUCTS
-- ==============================================================================
-- This script adds the missing supplier_id column to the products table
-- to allow associating products with suppliers.

-- Add supplier_id column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);

-- Optional: Add a comment to document the column
COMMENT ON COLUMN public.products.supplier_id IS 'Reference to the supplier who provides this product';
