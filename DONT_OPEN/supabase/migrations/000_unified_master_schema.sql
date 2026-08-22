-- ==============================================================================
-- DRIP POS: COMPLETE UNIFIED MASTER SCHEMA (FRESH DATABASE RESET & RECREATION)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. CLEAN RESET: DROP ALL EXISTING FUNCTIONS & OBJECTS IN PUBLIC SCHEMA
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Dynamically drop ALL overloaded function signatures in public schema
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
            'handle_new_user_onboarding',
            'receive_stock_batch',
            'allocate_and_consume_stock',
            'process_pos_sale',
            'delete_store_cascade',
            'hard_delete_product',
            'hard_delete_ingredient',
            'hard_delete_recipe',
            'hard_delete_category',
            'reset_all_business_data',
            'seed_organization_default_units',
            'get_user_organization_ids',
            'is_org_admin',
            'is_store_accessible'
          )
    LOOP
        EXECUTE r.stmt;
    END LOOP;
END $$;

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
-- 3. MASTER CATALOG & RECIPES
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

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    base_unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    sku TEXT,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    product_type TEXT DEFAULT 'finished_good' NOT NULL,
    track_stock BOOLEAN DEFAULT true NOT NULL,
    track_batch BOOLEAN DEFAULT false NOT NULL,
    track_expiry BOOLEAN DEFAULT false NOT NULL,
    inventory_method TEXT DEFAULT 'FIFO' NOT NULL,
    hpp_enabled BOOLEAN DEFAULT true NOT NULL,
    selling_price NUMERIC DEFAULT 0 NOT NULL,
    cost_price NUMERIC DEFAULT 0 NOT NULL,
    min_stock INT DEFAULT 0 NOT NULL,
    image_url TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.store_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    selling_price NUMERIC,
    is_available BOOLEAN DEFAULT true NOT NULL,
    UNIQUE(store_id, product_id)
);

CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    base_unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    sku TEXT,
    barcode TEXT,
    track_batch BOOLEAN DEFAULT true NOT NULL,
    track_expiry BOOLEAN DEFAULT true NOT NULL,
    inventory_method TEXT DEFAULT 'FIFO' NOT NULL,
    hpp_enabled BOOLEAN DEFAULT true NOT NULL,
    current_stock NUMERIC DEFAULT 0 NOT NULL,
    min_stock NUMERIC DEFAULT 0 NOT NULL,
    avg_cost NUMERIC DEFAULT 0 NOT NULL, -- Stored as purchase price per base unit (e.g. 120,000 / kg)
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    inventory_method TEXT DEFAULT 'FIFO' NOT NULL,
    current_version_id UUID,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    yield_quantity NUMERIC DEFAULT 1 NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(recipe_id, version_number)
);

CREATE TABLE public.recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_version_id UUID NOT NULL REFERENCES public.recipe_versions(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
    quantity NUMERIC NOT NULL, -- Specified in portion units (g, ml, pcs)
    unit_id UUID NOT NULL REFERENCES public.units(id),
    wastage_percent NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. INVENTORY & FIFO BATCHES
-- ------------------------------------------------------------------------------
CREATE TABLE public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC DEFAULT 0 NOT NULL, -- Stored in portion units (g, ml, pcs)
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(warehouse_id, product_id, ingredient_id)
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
    unit_cost NUMERIC NOT NULL, -- Cost per small portion unit (IDR / g or IDR / ml)
    total_cost NUMERIC NOT NULL,
    received_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at DATE,
    status TEXT DEFAULT 'AVAILABLE' NOT NULL, -- AVAILABLE, DEPLETED, EXPIRED, QUARANTINE
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.stock_batches(id) ON DELETE SET NULL,
    movement_type TEXT NOT NULL, -- PURCHASE_RECEIVE, SALE, ADJUSTMENT, WASTE
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
    status TEXT DEFAULT 'COMPLETED' NOT NULL,
    payment_method TEXT DEFAULT 'cash' NOT NULL,
    subtotal NUMERIC DEFAULT 0 NOT NULL,
    discount NUMERIC DEFAULT 0 NOT NULL,
    tax NUMERIC DEFAULT 0 NOT NULL,
    grand_total NUMERIC DEFAULT 0 NOT NULL,
    paid_amount NUMERIC DEFAULT 0 NOT NULL,
    change_amount NUMERIC DEFAULT 0 NOT NULL,
    total_cogs NUMERIC DEFAULT 0 NOT NULL,
    gross_profit NUMERIC DEFAULT 0 NOT NULL,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(store_id, receipt_number)
);

CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    unit_price NUMERIC DEFAULT 0 NOT NULL,
    quantity NUMERIC DEFAULT 1 NOT NULL,
    subtotal NUMERIC DEFAULT 0 NOT NULL,
    unit_cogs NUMERIC DEFAULT 0 NOT NULL,
    total_cogs NUMERIC DEFAULT 0 NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    amount NUMERIC DEFAULT 0 NOT NULL,
    tendered NUMERIC DEFAULT 0 NOT NULL,
    change NUMERIC DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.sale_inventory_consumptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    sale_item_id UUID NOT NULL REFERENCES public.sale_items(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES public.stock_batches(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
    quantity_consumed NUMERIC NOT NULL,
    unit_cost NUMERIC NOT NULL,
    subtotal_cost NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. SECURITY DEFINER RLS HELPER FUNCTIONS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_organization_ids(p_user_id UUID)
RETURNS TABLE (organization_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT om.organization_id
    FROM public.organization_members om
    WHERE om.user_id = p_user_id
      AND om.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_org_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members om
        WHERE om.organization_id = p_org_id
          AND om.user_id = p_user_id
          AND om.role IN ('owner', 'admin')
          AND om.status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 7. SEED STANDARD UNITS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_organization_default_units(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
    v_g_id UUID;
    v_kg_id UUID;
    v_ml_id UUID;
    v_l_id UUID;
    v_pcs_id UUID;
    v_box_id UUID;
BEGIN
    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES 
    (p_org_id, 'Gram', 'g', 'WEIGHT', true) RETURNING id INTO v_g_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES 
    (p_org_id, 'Kilogram', 'kg', 'WEIGHT', false) RETURNING id INTO v_kg_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES 
    (p_org_id, 'Milliliter', 'ml', 'VOLUME', true) RETURNING id INTO v_ml_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES 
    (p_org_id, 'Liter', 'L', 'VOLUME', false) RETURNING id INTO v_l_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES 
    (p_org_id, 'Pieces', 'pcs', 'QUANTITY', true) RETURNING id INTO v_pcs_id;

    INSERT INTO public.units (organization_id, name, symbol, unit_type, is_base)
    VALUES 
    (p_org_id, 'Box', 'box', 'QUANTITY', false) RETURNING id INTO v_box_id;

    INSERT INTO public.unit_conversions (organization_id, from_unit_id, to_unit_id, conversion_factor)
    VALUES
    (p_org_id, v_kg_id, v_g_id, 1000),
    (p_org_id, v_l_id, v_ml_id, 1000)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 8. ONBOARDING PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_onboarding(
    p_user_id UUID,
    p_full_name TEXT,
    p_business_name TEXT,
    p_plan_slug TEXT DEFAULT 'free'
)
RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_slug TEXT;
    v_profile_id UUID;
BEGIN
    INSERT INTO public.profiles (id, email, name)
    SELECT id, email, COALESCE(p_full_name, 'Owner')
    FROM auth.users WHERE id = p_user_id
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_profile_id;

    v_slug := lower(regexp_replace(p_business_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(md5(random()::text), 1, 4);

    INSERT INTO public.organizations (name, slug)
    VALUES (p_business_name, v_slug)
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (v_org_id, p_user_id, 'owner', 'active');

    PERFORM public.seed_organization_default_units(v_org_id);

    RETURN jsonb_build_object(
        'profile_id', v_profile_id,
        'organization_id', v_org_id,
        'business_name', p_business_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 9. INVENTORY ENGINE PROCEDURES (PORTION NORMALIZATION & STRICT FIFO)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.receive_stock_batch(
    p_organization_id UUID,
    p_store_id UUID,
    p_warehouse_id UUID,
    p_product_id UUID,
    p_ingredient_id UUID,
    p_batch_number TEXT,
    p_quantity NUMERIC,
    p_unit_cost NUMERIC,
    p_expires_at DATE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_batch_id UUID;
    v_total_cost NUMERIC;
    v_user_id UUID := auth.uid();
    v_unit_symbol TEXT;
    v_norm_qty NUMERIC := p_quantity;
    v_norm_unit_cost NUMERIC := p_unit_cost;
BEGIN
    IF p_ingredient_id IS NOT NULL THEN
        SELECT u.symbol INTO v_unit_symbol
        FROM public.ingredients i
        LEFT JOIN public.units u ON u.id = i.base_unit_id
        WHERE i.id = p_ingredient_id;

        IF LOWER(v_unit_symbol) = 'kg' THEN
            v_norm_qty := p_quantity * 1000;
            v_norm_unit_cost := p_unit_cost / 1000;
        ELSIF LOWER(v_unit_symbol) IN ('l', 'liter', 'litre') THEN
            v_norm_qty := p_quantity * 1000;
            v_norm_unit_cost := p_unit_cost / 1000;
        END IF;
    END IF;

    v_total_cost := v_norm_qty * v_norm_unit_cost;

    INSERT INTO public.stock_batches (
        organization_id, store_id, warehouse_id,
        product_id, ingredient_id, batch_number,
        quantity_received, quantity_remaining,
        unit_cost, total_cost, expires_at, status
    ) VALUES (
        p_organization_id, p_store_id, p_warehouse_id,
        p_product_id, p_ingredient_id, p_batch_number,
        v_norm_qty, v_norm_qty,
        v_norm_unit_cost, v_total_cost, p_expires_at, 'AVAILABLE'
    ) RETURNING id INTO v_batch_id;

    INSERT INTO public.stock_movements (
        organization_id, store_id, warehouse_id,
        product_id, ingredient_id, batch_id,
        movement_type, quantity, unit_cost, total_cost,
        notes, created_by
    ) VALUES (
        p_organization_id, p_store_id, p_warehouse_id,
        p_product_id, p_ingredient_id, v_batch_id,
        'PURCHASE_RECEIVE', v_norm_qty, v_norm_unit_cost, v_total_cost,
        p_notes, v_user_id
    );

    INSERT INTO public.inventory_items (
        organization_id, store_id, warehouse_id,
        product_id, ingredient_id, quantity
    ) VALUES (
        p_organization_id, p_store_id, p_warehouse_id,
        p_product_id, p_ingredient_id, v_norm_qty
    )
    ON CONFLICT (warehouse_id, product_id, ingredient_id)
    DO UPDATE SET
        quantity = public.inventory_items.quantity + v_norm_qty,
        updated_at = now();

    IF p_ingredient_id IS NOT NULL THEN
        UPDATE public.ingredients
        SET current_stock = current_stock + v_norm_qty,
            avg_cost = p_unit_cost,
            updated_at = now()
        WHERE id = p_ingredient_id;
    END IF;

    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.allocate_and_consume_stock(
    p_organization_id UUID,
    p_store_id UUID,
    p_warehouse_id UUID,
    p_product_id UUID,
    p_ingredient_id UUID,
    p_quantity_needed NUMERIC,
    p_method TEXT DEFAULT 'FIFO',
    p_reference_type TEXT DEFAULT 'sale',
    p_reference_id TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_remaining_needed NUMERIC := p_quantity_needed;
    v_allocated_list JSONB := '[]'::jsonb;
    v_batch RECORD;
    v_take_qty NUMERIC;
    v_total_cost NUMERIC := 0;
    v_user_id UUID := auth.uid();
    v_total_available NUMERIC := 0;
    v_item_name TEXT := 'Item';
    v_unit_symbol TEXT := 'units';
BEGIN
    SELECT COALESCE(SUM(quantity_remaining), 0) INTO v_total_available
    FROM public.stock_batches
    WHERE organization_id = p_organization_id
      AND store_id = p_store_id
      AND warehouse_id = p_warehouse_id
      AND ((p_product_id IS NOT NULL AND product_id = p_product_id) OR (p_ingredient_id IS NOT NULL AND ingredient_id = p_ingredient_id))
      AND status = 'AVAILABLE'
      AND quantity_remaining > 0;

    IF p_ingredient_id IS NOT NULL THEN
        SELECT i.name, COALESCE(u.symbol, 'g') INTO v_item_name, v_unit_symbol 
        FROM public.ingredients i
        LEFT JOIN public.units u ON u.id = i.base_unit_id
        WHERE i.id = p_ingredient_id;

        IF LOWER(v_unit_symbol) IN ('kg', 'l', 'liter', 'litre') THEN
            v_unit_symbol := CASE WHEN LOWER(v_unit_symbol) = 'kg' THEN 'g' ELSE 'ml' END;
        END IF;
    ELSIF p_product_id IS NOT NULL THEN
        SELECT name INTO v_item_name FROM public.products WHERE id = p_product_id;
    END IF;

    IF v_total_available < p_quantity_needed THEN
        RAISE EXCEPTION 'Insufficient stock for "%": Required % % but only % % available in warehouse.',
            COALESCE(v_item_name, 'Item'), p_quantity_needed, v_unit_symbol, v_total_available, v_unit_symbol;
    END IF;

    FOR v_batch IN
        SELECT id, batch_number, quantity_remaining, unit_cost, expires_at
        FROM public.stock_batches
        WHERE organization_id = p_organization_id
          AND store_id = p_store_id
          AND warehouse_id = p_warehouse_id
          AND ((p_product_id IS NOT NULL AND product_id = p_product_id) OR (p_ingredient_id IS NOT NULL AND ingredient_id = p_ingredient_id))
          AND status = 'AVAILABLE'
          AND quantity_remaining > 0
        ORDER BY
            CASE WHEN p_method = 'FEFO' THEN expires_at END ASC NULLS LAST,
            received_at ASC
    LOOP
        EXIT WHEN v_remaining_needed <= 0;

        v_take_qty := LEAST(v_batch.quantity_remaining, v_remaining_needed);

        UPDATE public.stock_batches
        SET quantity_remaining = quantity_remaining - v_take_qty,
            status = CASE WHEN (quantity_remaining - v_take_qty) <= 0 THEN 'DEPLETED' ELSE 'AVAILABLE' END,
            updated_at = now()
        WHERE id = v_batch.id;

        INSERT INTO public.stock_movements (
            organization_id, store_id, warehouse_id,
            product_id, ingredient_id, batch_id,
            movement_type, quantity, unit_cost, total_cost,
            reference_type, reference_id, created_by
        ) VALUES (
            p_organization_id, p_store_id, p_warehouse_id,
            p_product_id, p_ingredient_id, v_batch.id,
            'SALE', -v_take_qty, v_batch.unit_cost, (v_take_qty * v_batch.unit_cost),
            p_reference_type, p_reference_id, v_user_id
        );

        v_total_cost := v_total_cost + (v_take_qty * v_batch.unit_cost);
        v_remaining_needed := v_remaining_needed - v_take_qty;

        v_allocated_list := v_allocated_list || jsonb_build_object(
            'batch_id', v_batch.id,
            'batch_number', v_batch.batch_number,
            'quantity_consumed', v_take_qty,
            'unit_cost', v_batch.unit_cost,
            'subtotal_cost', (v_take_qty * v_batch.unit_cost)
        );
    END LOOP;

    UPDATE public.inventory_items
    SET quantity = GREATEST(0, quantity - p_quantity_needed),
        updated_at = now()
    WHERE warehouse_id = p_warehouse_id
      AND ((p_product_id IS NOT NULL AND product_id = p_product_id) OR (p_ingredient_id IS NOT NULL AND ingredient_id = p_ingredient_id));

    IF p_ingredient_id IS NOT NULL THEN
        UPDATE public.ingredients
        SET current_stock = GREATEST(0, current_stock - p_quantity_needed),
            updated_at = now()
        WHERE id = p_ingredient_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'quantity_requested', p_quantity_needed,
        'quantity_fulfilled', p_quantity_needed,
        'total_cogs', v_total_cost,
        'allocations', v_allocated_list
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 10. ATOMIC POS CHECKOUT SALE PROCEDURE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_pos_sale(
    p_organization_id UUID,
    p_store_id UUID,
    p_warehouse_id UUID,
    p_receipt_number TEXT,
    p_items JSONB, -- array of { product_id, product_name, unit_price, quantity, notes }
    p_payment_method TEXT,
    p_amount NUMERIC,
    p_tendered NUMERIC,
    p_discount NUMERIC DEFAULT 0,
    p_tax NUMERIC DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_sale_id UUID;
    v_user_id UUID := auth.uid();
    v_item JSONB;
    v_product_id UUID;
    v_product_name TEXT;
    v_unit_price NUMERIC;
    v_quantity NUMERIC;
    v_notes TEXT;
    v_subtotal NUMERIC := 0;
    v_total_cogs NUMERIC := 0;
    v_item_cogs NUMERIC := 0;
    v_sale_item_id UUID;
    v_recipe RECORD;
    v_recipe_item RECORD;
    v_allocation_res JSONB;
    v_change NUMERIC;
BEGIN
    v_change := GREATEST(0, p_tendered - p_amount);

    INSERT INTO public.sales (
        organization_id, store_id, receipt_number,
        status, payment_method, subtotal, discount, tax,
        grand_total, paid_amount, change_amount, created_by
    ) VALUES (
        p_organization_id, p_store_id, p_receipt_number,
        'COMPLETED', p_payment_method, (p_amount + p_discount - p_tax), p_discount, p_tax,
        p_amount, p_tendered, v_change, v_user_id
    ) RETURNING id INTO v_sale_id;

    INSERT INTO public.sale_payments (
        organization_id, sale_id, payment_method,
        amount, tendered, change
    ) VALUES (
        p_organization_id, v_sale_id, p_payment_method,
        p_amount, p_tendered, v_change
    );

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_product_name := v_item->>'product_name';
        v_unit_price := (v_item->>'unit_price')::numeric;
        v_quantity := (v_item->>'quantity')::numeric;
        v_notes := v_item->>'notes';
        v_item_cogs := 0;

        INSERT INTO public.sale_items (
            organization_id, sale_id, product_id,
            product_name, unit_price, quantity,
            subtotal, notes
        ) VALUES (
            p_organization_id, v_sale_id, v_product_id,
            v_product_name, v_unit_price, v_quantity,
            (v_unit_price * v_quantity), v_notes
        ) RETURNING id INTO v_sale_item_id;

        -- Check if product has an active recipe
        SELECT r.id, r.current_version_id, r.inventory_method
        INTO v_recipe
        FROM public.recipes r
        WHERE r.product_id = v_product_id AND r.status = 'active'
        LIMIT 1;

        IF v_recipe.id IS NOT NULL AND v_recipe.current_version_id IS NOT NULL THEN
            -- Deduct each ingredient from recipe
            FOR v_recipe_item IN
                SELECT ri.ingredient_id, ri.quantity, ri.wastage_percent
                FROM public.recipe_items ri
                WHERE ri.recipe_version_id = v_recipe.current_version_id
            LOOP
                v_allocation_res := public.allocate_and_consume_stock(
                    p_organization_id, p_store_id, p_warehouse_id,
                    NULL, v_recipe_item.ingredient_id,
                    (v_recipe_item.quantity * (1 + v_recipe_item.wastage_percent / 100) * v_quantity),
                    v_recipe.inventory_method,
                    'sale', v_sale_id::text
                );

                v_item_cogs := v_item_cogs + COALESCE((v_allocation_res->>'total_cogs')::numeric, 0);

                -- Record consumption breakdown
                INSERT INTO public.sale_inventory_consumptions (
                    organization_id, sale_id, sale_item_id,
                    ingredient_id, quantity_consumed, unit_cost, subtotal_cost
                ) VALUES (
                    p_organization_id, v_sale_id, v_sale_item_id,
                    v_recipe_item.ingredient_id,
                    (v_recipe_item.quantity * (1 + v_recipe_item.wastage_percent / 100) * v_quantity),
                    COALESCE((v_allocation_res->>'total_cogs')::numeric / NULLIF(v_quantity, 0), 0),
                    COALESCE((v_allocation_res->>'total_cogs')::numeric, 0)
                );
            END LOOP;
        ELSE
            -- Deduct direct product stock if tracked
            v_allocation_res := public.allocate_and_consume_stock(
                p_organization_id, p_store_id, p_warehouse_id,
                v_product_id, NULL,
                v_quantity, 'FIFO', 'sale', v_sale_id::text
            );
            v_item_cogs := COALESCE((v_allocation_res->>'total_cogs')::numeric, 0);
        END IF;

        UPDATE public.sale_items
        SET unit_cogs = (v_item_cogs / NULLIF(v_quantity, 0)),
            total_cogs = v_item_cogs
        WHERE id = v_sale_item_id;

        v_total_cogs := v_total_cogs + v_item_cogs;
    END LOOP;

    UPDATE public.sales
    SET total_cogs = v_total_cogs,
        gross_profit = (p_amount - v_total_cogs)
    WHERE id = v_sale_id;

    RETURN jsonb_build_object(
        'success', true,
        'sale_id', v_sale_id,
        'receipt_number', p_receipt_number,
        'grand_total', p_amount,
        'total_cogs', v_total_cogs,
        'gross_profit', (p_amount - v_total_cogs),
        'change', v_change
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 11. HARD DELETE & CASCADE CLEANUP PROCEDURES
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hard_delete_product(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.sale_items WHERE product_id = p_product_id;
    DELETE FROM public.stock_movements WHERE product_id = p_product_id;
    DELETE FROM public.inventory_items WHERE product_id = p_product_id;
    DELETE FROM public.stock_batches WHERE product_id = p_product_id;
    DELETE FROM public.store_products WHERE product_id = p_product_id;
    DELETE FROM public.recipes WHERE product_id = p_product_id;
    DELETE FROM public.products WHERE id = p_product_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.hard_delete_ingredient(p_ingredient_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.recipe_items WHERE ingredient_id = p_ingredient_id;
    DELETE FROM public.stock_movements WHERE ingredient_id = p_ingredient_id;
    DELETE FROM public.inventory_items WHERE ingredient_id = p_ingredient_id;
    DELETE FROM public.stock_batches WHERE ingredient_id = p_ingredient_id;
    DELETE FROM public.ingredients WHERE id = p_ingredient_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.hard_delete_recipe(p_recipe_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM public.recipe_items WHERE recipe_version_id IN (
        SELECT id FROM public.recipe_versions WHERE recipe_id = p_recipe_id
    );
    DELETE FROM public.recipe_versions WHERE recipe_id = p_recipe_id;
    DELETE FROM public.recipes WHERE id = p_recipe_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.delete_store_cascade(p_store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_org_id UUID;
    v_user_id UUID := auth.uid();
BEGIN
    SELECT organization_id INTO v_org_id FROM public.stores WHERE id = p_store_id;

    IF NOT public.is_org_admin(v_org_id, v_user_id) THEN
        RAISE EXCEPTION 'Unauthorized: Only organization owners and admins can delete a store.';
    END IF;

    DELETE FROM public.stores WHERE id = p_store_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.reset_all_business_data(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF NOT public.is_org_admin(p_org_id, v_user_id) THEN
        RAISE EXCEPTION 'Unauthorized: Only organization owners and admins can reset business data.';
    END IF;

    DELETE FROM public.sale_inventory_consumptions WHERE organization_id = p_org_id;
    DELETE FROM public.sale_payments WHERE organization_id = p_org_id;
    DELETE FROM public.sale_items WHERE organization_id = p_org_id;
    DELETE FROM public.sales WHERE organization_id = p_org_id;

    DELETE FROM public.stock_movements WHERE organization_id = p_org_id;
    DELETE FROM public.stock_batches WHERE organization_id = p_org_id;
    DELETE FROM public.inventory_items WHERE organization_id = p_org_id;
    DELETE FROM public.warehouses WHERE organization_id = p_org_id;

    DELETE FROM public.recipe_items WHERE organization_id = p_org_id;
    DELETE FROM public.recipe_versions WHERE organization_id = p_org_id;
    DELETE FROM public.recipes WHERE organization_id = p_org_id;
    DELETE FROM public.ingredients WHERE organization_id = p_org_id;
    DELETE FROM public.store_products WHERE store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id);
    DELETE FROM public.products WHERE organization_id = p_org_id;
    DELETE FROM public.categories WHERE organization_id = p_org_id;

    DELETE FROM public.store_members WHERE store_id IN (SELECT id FROM public.stores WHERE organization_id = p_org_id);
    DELETE FROM public.stores WHERE organization_id = p_org_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
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
ALTER TABLE public.recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_inventory_consumptions ENABLE ROW LEVEL SECURITY;

-- Profiles Policy
CREATE POLICY "Profiles accessible by owner" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- Organizations Policy
CREATE POLICY "Organizations accessible by members" ON public.organizations
    FOR SELECT USING (id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Organizations manageable by admins" ON public.organizations
    FOR ALL USING (public.is_org_admin(id, auth.uid()));

-- Organization Members Policy
CREATE POLICY "Members viewable by org members" ON public.organization_members
    FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Members manageable by admins" ON public.organization_members
    FOR ALL USING (public.is_org_admin(organization_id, auth.uid()));

-- Stores Policy
CREATE POLICY "Stores viewable by org members" ON public.stores
    FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Stores manageable by admins" ON public.stores
    FOR ALL USING (public.is_org_admin(organization_id, auth.uid()));

-- Warehouses Policy
CREATE POLICY "Warehouses viewable by org members" ON public.warehouses
    FOR SELECT USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Warehouses manageable by admins" ON public.warehouses
    FOR ALL USING (public.is_org_admin(organization_id, auth.uid()));

-- Catalog Master Policies (Categories, Products, Ingredients, Recipes, Units)
CREATE POLICY "Categories org access" ON public.categories
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Units org access" ON public.units
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Unit conversions org access" ON public.unit_conversions
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Products org access" ON public.products
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Store products org access" ON public.store_products
    FOR ALL USING (store_id IN (SELECT id FROM public.stores WHERE organization_id IN (SELECT public.get_user_organization_ids(auth.uid()))));

CREATE POLICY "Ingredients org access" ON public.ingredients
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Recipes org access" ON public.recipes
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Recipe versions org access" ON public.recipe_versions
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Recipe items org access" ON public.recipe_items
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

-- Inventory & Stock Policies
CREATE POLICY "Inventory items org access" ON public.inventory_items
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Stock batches org access" ON public.stock_batches
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Stock movements org access" ON public.stock_movements
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

-- Sales Policies
CREATE POLICY "Sales org access" ON public.sales
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Sale items org access" ON public.sale_items
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Sale payments org access" ON public.sale_payments
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

CREATE POLICY "Sale consumptions org access" ON public.sale_inventory_consumptions
    FOR ALL USING (organization_id IN (SELECT public.get_user_organization_ids(auth.uid())));

-- ------------------------------------------------------------------------------
-- 13. REALTIME PUBLICATION SETUP
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_movements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
