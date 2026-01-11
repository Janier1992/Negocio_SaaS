-- ==============================================================================
-- 10 ADD DOC NUMBER TO CUSTOMERS
-- ==============================================================================
-- Adds a 'doc_number' column to store Cédula/NIT/DNI.

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS doc_number TEXT;
-- Optional: Make doc_number unique per business to prevent duplicates?
-- For now, just adding the column.
