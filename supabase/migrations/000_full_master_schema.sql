-- ==============================================================================
-- DRIP POS: COMPLETE & UPDATED MASTER DATABASE SCHEMA
-- Multi-Tenancy (Organizations, Plans, Subscriptions), Multi-Store Branches,
-- POS Terminal, Recipes & HPP, Ingredients, Categories & Unified Stock Tracking
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. CLEAN RESET PREVIOUS OBJECTS (SAFE RE-RUN)
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
            'calculate_recipe_hpp',
            'deduct_recipe_inventory'
          )
    LOOP
        EXECUTE r.stmt;
    END LOOP;
END $$;

-- Drop dependent tables in reverse order
DROP TABLE IF EXISTS public.sale_payments CASCADE;
DROP TABLE IF EXISTS public.sale_items CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.stock_transactions CASCADE;
DROP TABLE IF EXISTS public.recipe_extras CASCADE;
DROP TABLE IF EXISTS public.recipe_ingredients CASCADE;
DROP TABLE IF EXISTS public.recipes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.ingredients CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.category_parents CASCADE;
DROP TABLE IF EXISTS public.warehouses CASCADE;
DROP TABLE IF EXISTS public.store_members CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
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
-- 2. PROFILES & ORGANIZATIONS (MULTI-TENANCY)
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
    role TEXT DEFAULT 'owner' NOT NULL, -- owner, admin, manager, cashier, staff
    status TEXT DEFAULT 'active' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 3. PLANS & SUBSCRIPTIONS (TIERED BILLING & STORE QUOTAS)
-- ------------------------------------------------------------------------------
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    price NUMERIC DEFAULT 0 NOT NULL,
    max_stores INT DEFAULT 1 NOT NULL,
    max_users INT DEFAULT 5 NOT NULL,
    features JSONB DEFAULT '[]'::jsonb NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT DEFAULT 'active' NOT NULL, -- active, past_due, canceled, trialing
    current_period_start TIMESTAMPTZ DEFAULT now() NOT NULL,
    current_period_end TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days') NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. STORES (MULTI-STORE / BRANCHES) & WAREHOUSES
-- ------------------------------------------------------------------------------
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
    role TEXT DEFAULT 'cashier' NOT NULL, -- manager, cashier, staff, owner
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
-- 5. SUPPLIERS, CATEGORIES & INGREDIENTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.category_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.category_parents(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#065F46' NOT NULL,
    sort_order INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    cost_type TEXT DEFAULT 'per_gram_manual' NOT NULL, -- per_gram_manual, per_gram_auto, per_pcs
    buy_price NUMERIC(15, 2),
    item_qty NUMERIC(15, 2),
    item_unit TEXT DEFAULT 'g', -- ml, l, g, kg, pcs
    cost_per_gram NUMERIC(15, 4) DEFAULT 0,
    current_stock NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    min_stock_level NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    reorder_quantity NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    low_stock_alert INT DEFAULT 1 NOT NULL, -- 1=enabled, 0=disabled
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. RECIPES & DYNAMIC HPP (COST OF GOODS SOLD)
-- ------------------------------------------------------------------------------
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    qty_used NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_extras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    extra_name TEXT NOT NULL,
    value_type TEXT DEFAULT 'flat' NOT NULL, -- flat, percentage
    value NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 7. PRODUCTS (MENU ITEMS)
-- ------------------------------------------------------------------------------
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    use_hpp INT DEFAULT 0 NOT NULL, -- 1=use linked recipe hpp, 0=manual buy_price
    buy_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    sell_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    base_price NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    use_stock INT DEFAULT 1 NOT NULL, -- 1=track stock, 0=unlimited/service
    stock_quantity NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    min_stock_level NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    low_stock_alert INT DEFAULT 1 NOT NULL,
    stock_source TEXT DEFAULT 'self' NOT NULL, -- self, recipe
    image_uri TEXT,
    status TEXT DEFAULT 'active' NOT NULL,
    last_restocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. UNIFIED STOCK TRANSACTIONS & MOVEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL, -- ingredient, product
    item_id UUID NOT NULL,
    transaction_type TEXT NOT NULL, -- sale, restock, adjustment, recipe_deduction, opname
    quantity NUMERIC(15, 2) NOT NULL,
    quantity_before NUMERIC(15, 2) NOT NULL,
    quantity_after NUMERIC(15, 2) NOT NULL,
    reason TEXT,
    reference_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 9. POS SALES & PAYMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    subtotal NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    discount_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    tax_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    service_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    total_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    payment_method TEXT DEFAULT 'cash' NOT NULL, -- cash, qris, transfer, split
    status TEXT DEFAULT 'completed' NOT NULL, -- completed, cancelled, refunded
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity NUMERIC(15, 2) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    buy_price_snapshot NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    status TEXT DEFAULT 'success' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 10. AUTH TRIGGER: AUTO SETUP PROFILE, ORG (WITH USER'S BUSINESS NAME) & OWNER ROLE
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    biz_name TEXT;
    slug_val TEXT;
    starter_plan_id UUID;
BEGIN
    -- 1. Determine Business Name from metadata
    biz_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'businessName'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'business_name'), ''),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), '') || '''s Business',
        'DRIP POS Business'
    );

    -- 2. Create Profile
    INSERT INTO public.profiles (id, email, name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, 'user@drippos.app'),
        COALESCE(NEW.raw_user_meta_data->>'fullName', NEW.raw_user_meta_data->>'name', 'Staff'),
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email;

    -- 3. Create Tenant Organization
    slug_val := lower(regexp_replace(biz_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substring(NEW.id::text, 1, 6);
    
    INSERT INTO public.organizations (name, slug, currency, timezone)
    VALUES (biz_name, slug_val, 'IDR', 'Asia/Jakarta')
    RETURNING id INTO new_org_id;

    -- 4. Assign Owner Membership
    INSERT INTO public.organization_members (organization_id, user_id, role, status)
    VALUES (new_org_id, NEW.id, 'owner', 'active');

    -- 5. Attach Free Starter Plan Subscription
    SELECT id INTO starter_plan_id FROM public.plans WHERE slug = 'starter' LIMIT 1;
    IF starter_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (organization_id, plan_id, status)
        VALUES (new_org_id, starter_plan_id, 'active');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- ------------------------------------------------------------------------------
-- 11. DEFAULT PLANS SEED DATA
-- ------------------------------------------------------------------------------
INSERT INTO public.plans (name, slug, price, max_stores, max_users, features)
VALUES 
    ('Starter Free Trial', 'starter', 0, 1, 3, '["pos_terminal", "inventory", "recipes", "single_store"]'::jsonb),
    ('Pro Growth', 'pro', 199000, 3, 10, '["pos_terminal", "inventory", "recipes", "analytics", "multi_store_3"]'::jsonb),
    ('Enterprise Unlimited', 'enterprise', 499000, 10, 50, '["all_features", "unlimited_stores", "priority_support"]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

-- Permissive authenticated access policies
CREATE POLICY "Public profiles access" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Organizations access" ON public.organizations FOR ALL USING (true);
CREATE POLICY "Org members access" ON public.organization_members FOR ALL USING (true);
CREATE POLICY "Plans access" ON public.plans FOR ALL USING (true);
CREATE POLICY "Subscriptions access" ON public.subscriptions FOR ALL USING (true);
CREATE POLICY "Stores access" ON public.stores FOR ALL USING (true);
CREATE POLICY "Store members access" ON public.store_members FOR ALL USING (true);
CREATE POLICY "Warehouses access" ON public.warehouses FOR ALL USING (true);
CREATE POLICY "Suppliers access" ON public.suppliers FOR ALL USING (true);
CREATE POLICY "Category parents access" ON public.category_parents FOR ALL USING (true);
CREATE POLICY "Categories access" ON public.categories FOR ALL USING (true);
CREATE POLICY "Ingredients access" ON public.ingredients FOR ALL USING (true);
CREATE POLICY "Recipes access" ON public.recipes FOR ALL USING (true);
CREATE POLICY "Recipe ingredients access" ON public.recipe_ingredients FOR ALL USING (true);
CREATE POLICY "Recipe extras access" ON public.recipe_extras FOR ALL USING (true);
CREATE POLICY "Products access" ON public.products FOR ALL USING (true);
CREATE POLICY "Stock transactions access" ON public.stock_transactions FOR ALL USING (true);
CREATE POLICY "Sales access" ON public.sales FOR ALL USING (true);
CREATE POLICY "Sale items access" ON public.sale_items FOR ALL USING (true);
CREATE POLICY "Sale payments access" ON public.sale_payments FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 13. REALTIME PUBLICATION SETUP
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ingredients;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.category_parents;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_transactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ------------------------------------------------------------------------------
-- 14. SCHEMA PERMISSIONS & POSTGREST SCHEMA CACHE RELOAD
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Force PostgREST schema cache reload immediately
NOTIFY pgrst, 'reload schema';
