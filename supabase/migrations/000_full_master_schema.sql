-- ==============================================================================
-- DRIP POS: COMPLETE UNIFIED MASTER SCHEMA (SINGLE RUN FOR FRESH SUPABASE SETUP)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. CLEAN RESET (IF RERUNNING)
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT 'DROP FUNCTION IF EXISTS ' || oid::regprocedure::text || ' CASCADE;' AS stmt
        FROM pg_proc
        WHERE pronamespace = 'public'::regnamespace
          AND prokind = 'f'
          AND proname IN (
            'handle_auth_user_created',
            'handle_new_user_onboarding',
            'receive_stock_batch',
            'allocate_and_consume_stock',
            'process_pos_sale',
            'hard_delete_product',
            'hard_delete_ingredient',
            'seed_organization_default_units'
          )
    LOOP
        EXECUTE r.stmt;
    END LOOP;
END $$;

DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.sale_inventory_consumptions CASCADE;
DROP TABLE IF EXISTS public.sale_payments CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.stock_movements CASCADE;
DROP TABLE IF EXISTS public.stock_batches CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.recipe_items CASCADE;
DROP TABLE IF EXISTS public.recipe_versions CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;
DROP TABLE IF EXISTS public.store_products CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.product_groups CASCADE;
DROP TABLE IF EXISTS public.unit_conversions CASCADE;
DROP TABLE IF EXISTS public.units CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.store_members CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.subscription_items CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 2. FOUNDATION & TENANCY
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    legal_name TEXT,
    tax_id TEXT,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    timezone TEXT DEFAULT 'Asia/Jakarta' NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'owner' NOT NULL, -- owner, admin, manager, staff
    status TEXT DEFAULT 'active' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, user_id)
);

CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price NUMERIC DEFAULT 0 NOT NULL,
    max_stores INT DEFAULT 1 NOT NULL,
    max_users INT DEFAULT 5 NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL
);

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    currency TEXT DEFAULT 'IDR' NOT NULL,
    timezone TEXT DEFAULT 'Asia/Jakarta' NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, slug)
);

CREATE TABLE public.store_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'manager' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(store_id, user_id)
);

CREATE TABLE public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT true NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(store_id, name)
);

-- ------------------------------------------------------------------------------
-- 3. MASTER CATALOG, UNITS & SUPPLIERS
-- ------------------------------------------------------------------------------
CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    unit_type TEXT NOT NULL, -- WEIGHT, VOLUME, QUANTITY
    is_base BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, symbol)
);

CREATE TABLE public.unit_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    from_unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    to_unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    conversion_factor NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, from_unit_id, to_unit_id)
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#065F46' NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.product_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    product_group_id UUID REFERENCES public.product_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    base_price NUMERIC DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_override NUMERIC,
    sku TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    price NUMERIC DEFAULT 0 NOT NULL,
    is_available BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(store_id, product_id)
);

CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_unit_id UUID NOT NULL REFERENCES public.units(id),
    min_stock_alert NUMERIC DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    version_number INT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_version_id UUID NOT NULL REFERENCES public.recipe_versions(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL,
    unit_id UUID NOT NULL REFERENCES public.units(id),
    wastage_percent NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.suppliers (
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

-- ------------------------------------------------------------------------------
-- 4. INVENTORY & BATCHES
-- ------------------------------------------------------------------------------
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    name TEXT,
    sku TEXT,
    barcode TEXT,
    category TEXT,
    description TEXT,
    unit TEXT DEFAULT 'pcs',
    unit_cost NUMERIC DEFAULT 0,
    selling_price NUMERIC DEFAULT 0,
    quantity NUMERIC DEFAULT 0 NOT NULL,
    min_stock NUMERIC DEFAULT 0,
    max_stock NUMERIC DEFAULT 100,
    reorder_point NUMERIC DEFAULT 0,
    reorder_quantity NUMERIC DEFAULT 0,
    location TEXT,
    expiry_date DATE,
    last_restock_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.stock_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    quantity_received NUMERIC NOT NULL,
    quantity_remaining NUMERIC NOT NULL,
    unit_cost NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at DATE,
    status TEXT DEFAULT 'AVAILABLE' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.stock_batches(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit_cost NUMERIC DEFAULT 0 NOT NULL,
    total_cost NUMERIC DEFAULT 0 NOT NULL,
    reference_type TEXT,
    reference_id TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. POS SALES ENGINE
-- ------------------------------------------------------------------------------
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    receipt_number TEXT NOT NULL,
    subtotal NUMERIC DEFAULT 0 NOT NULL,
    tax_amount NUMERIC DEFAULT 0 NOT NULL,
    discount_amount NUMERIC DEFAULT 0 NOT NULL,
    total_amount NUMERIC DEFAULT 0 NOT NULL,
    total_hpp NUMERIC DEFAULT 0 NOT NULL,
    gross_profit NUMERIC DEFAULT 0 NOT NULL,
    payment_status TEXT DEFAULT 'COMPLETED' NOT NULL,
    cashier_id UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(store_id, receipt_number)
);

CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    quantity NUMERIC NOT NULL,
    unit_price NUMERIC NOT NULL,
    subtotal NUMERIC NOT NULL,
    total_hpp NUMERIC DEFAULT 0 NOT NULL,
    gross_profit NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL, -- CASH, QRIS, CARD
    amount NUMERIC NOT NULL,
    reference_number TEXT,
    status TEXT DEFAULT 'COMPLETED' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.sale_inventory_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
    stock_batch_id UUID REFERENCES public.stock_batches(id),
    ingredient_id UUID REFERENCES public.ingredients(id),
    product_id UUID REFERENCES public.products(id),
    quantity_consumed NUMERIC NOT NULL,
    unit_cost NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. DEFAULT UNIT SEEDING PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_organization_default_units(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
    v_g_id UUID;
    v_kg_id UUID;
    v_ml_id UUID;
    v_l_id UUID;
    v_pcs_id UUID;
BEGIN
    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES (p_org_id, 'Gram', 'g', 'WEIGHT', true)
    ON CONFLICT (organization_id, symbol) DO UPDATE SET is_base = true RETURNING id INTO v_g_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES (p_org_id, 'Kilogram', 'kg', 'WEIGHT', false)
    ON CONFLICT (organization_id, symbol) DO UPDATE SET is_base = false RETURNING id INTO v_kg_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES (p_org_id, 'Milliliter', 'ml', 'VOLUME', true)
    ON CONFLICT (organization_id, symbol) DO UPDATE SET is_base = true RETURNING id INTO v_ml_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES (p_org_id, 'Liter', 'l', 'VOLUME', false)
    ON CONFLICT (organization_id, symbol) DO UPDATE SET is_base = false RETURNING id INTO v_l_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES (p_org_id, 'Piece', 'pcs', 'QUANTITY', true)
    ON CONFLICT (organization_id, symbol) DO UPDATE SET is_base = true RETURNING id INTO v_pcs_id;

    INSERT INTO public.unit_conversions (organization_id, from_unit_id, to_unit_id, conversion_factor)
    VALUES
    (p_org_id, v_kg_id, v_g_id, 1000),
    (p_org_id, v_l_id, v_ml_id, 1000)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 7. AUTH USER CREATED TRIGGER (BUSINESS NAME = ORGANIZATION NAME)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_business_name TEXT;
    v_org_id UUID;
    v_slug TEXT;
BEGIN
    -- Extract full name and business name from sign up metadata
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_business_name := COALESCE(NEW.raw_user_meta_data->>'businessName', NEW.raw_user_meta_data->>'business_name', v_full_name || ' Business');

    -- 1. Create Profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (NEW.id, NEW.email, v_full_name)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

    -- 2. Create Organization using businessName
    v_slug := lower(regexp_replace(v_business_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 4);

    INSERT INTO public.organizations (name, slug)
    VALUES (v_business_name, v_slug)
    RETURNING id INTO v_org_id;

    -- 3. Add User as Organization Owner
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (v_org_id, NEW.id, 'owner', 'active')
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- 4. Seed Organization Default Units
    PERFORM public.seed_organization_default_units(v_org_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Dynamic Policy Rules
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Org members access" ON public.organizations FOR ALL USING (true);
CREATE POLICY "Org member roles access" ON public.organization_members FOR ALL USING (true);
CREATE POLICY "Stores access" ON public.stores FOR ALL USING (true);
CREATE POLICY "Store members access" ON public.store_members FOR ALL USING (true);
CREATE POLICY "Warehouses access" ON public.warehouses FOR ALL USING (true);
CREATE POLICY "Units access" ON public.units FOR ALL USING (true);
CREATE POLICY "Categories access" ON public.categories FOR ALL USING (true);
CREATE POLICY "Products access" ON public.products FOR ALL USING (true);
CREATE POLICY "Ingredients access" ON public.ingredients FOR ALL USING (true);
CREATE POLICY "Recipes access" ON public.recipes FOR ALL USING (true);
CREATE POLICY "Suppliers access" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Inventory access" ON public.inventory_items FOR ALL USING (true);
CREATE POLICY "Stock batches access" ON public.stock_batches FOR ALL USING (true);
CREATE POLICY "Stock movements access" ON public.stock_movements FOR ALL USING (true);
CREATE POLICY "Sales access" ON public.sales FOR ALL USING (true);
CREATE POLICY "Sale items access" ON public.sale_items FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 9. REALTIME PUBLICATION
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
