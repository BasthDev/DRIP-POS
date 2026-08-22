-- ==============================================================================
-- DRIP POS: SUPPLIERS TABLE & EXTENSIONS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    tax_id TEXT,
    payment_terms TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    rating NUMERIC DEFAULT 5 NOT NULL,
    total_orders INT DEFAULT 0 NOT NULL,
    total_spent NUMERIC DEFAULT 0 NOT NULL,
    last_order_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for organization query performance
CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON public.suppliers(organization_id);

-- Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view/modify suppliers in their organization
CREATE POLICY "Suppliers org access" ON public.suppliers
    FOR ALL
    USING (
        organization_id IS NULL OR organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
        )
    );

-- Optionally add realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
