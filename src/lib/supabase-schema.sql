-- ==============================================================================
-- LOCATIX — SCHEMA POSTGRESQL & POLITIQUES RLS SUPABASE
-- À exécuter dans le "SQL Editor" de votre projet Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('tenant', 'owner', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. TABLE HOUSES
CREATE TABLE IF NOT EXISTS public.houses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    location TEXT NOT NULL,
    address TEXT,
    description TEXT,
    bedrooms INT NOT NULL DEFAULT 1 CHECK (bedrooms >= 0),
    bathrooms INT NOT NULL DEFAULT 1 CHECK (bathrooms >= 0),
    property_type TEXT NOT NULL CHECK (property_type IN ('appartement', 'maison', 'studio', 'villa', 'chambre')),
    surface NUMERIC CHECK (surface IS NULL OR surface >= 0),
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_houses_location ON public.houses USING gin (to_tsvector('french', location));
CREATE INDEX IF NOT EXISTS idx_houses_price ON public.houses(price);
CREATE INDEX IF NOT EXISTS idx_houses_owner ON public.houses(owner_id);
CREATE INDEX IF NOT EXISTS idx_houses_available ON public.houses(is_available);

-- 4. TABLE HOUSE_IMAGES
CREATE TABLE IF NOT EXISTS public.house_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_house_images_house ON public.house_images(house_id);

-- 5. TABLE FAVORITES (Contrainte unique: un utilisateur ne peut pas liker 2 fois)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_house_favorite UNIQUE (user_id, house_id)
);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.favorites(user_id);

-- 6. TABLE RENTAL_REQUESTS
CREATE TABLE IF NOT EXISTS public.rental_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_tenant ON public.rental_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_requests_house ON public.rental_requests(house_id);

-- 7. TRIGGER AUTOMATIQUE PROFILES À L'INSCRIPTION AUTH.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Utilisateur'),
        new.email,
        new.raw_user_meta_data->>'phone',
        -- Le rôle admin ne peut JAMAIS être choisi à l'inscription
        CASE 
            WHEN new.raw_user_meta_data->>'role' = 'owner' THEN 'owner'
            ELSE 'tenant'
        END
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_requests ENABLE ROW LEVEL SECURITY;

-- Helper function pour savoir si l'utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLITIQUES: PROFILES
-- Lecture : les profils sont visibles par les utilisateurs connectés (pour afficher le propriétaire ou le locataire)
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Mise à jour : uniquement son propre profil, ou admin
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (id = auth.uid() OR public.is_admin());

-- POLITIQUES: HOUSES
-- Lecture : tout le monde peut voir les logements disponibles ; les propriétaires voient tous leurs logements ; admins voient tout
CREATE POLICY "Houses viewable by all authenticated"
    ON public.houses FOR SELECT
    TO authenticated
    USING (is_available = true OR owner_id = auth.uid() OR public.is_admin());

-- Insertion : les propriétaires peuvent insérer des logements pour eux-mêmes
CREATE POLICY "Owners can insert their own houses"
    ON public.houses FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = owner_id AND (
            EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
        )
    );

-- Modification : uniquement le propriétaire du logement ou un admin
CREATE POLICY "Owners can update their own houses"
    ON public.houses FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id OR public.is_admin())
    WITH CHECK (auth.uid() = owner_id OR public.is_admin());

-- Suppression : uniquement le propriétaire ou un admin
CREATE POLICY "Owners can delete their own houses"
    ON public.houses FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id OR public.is_admin());

-- POLITIQUES: HOUSE_IMAGES
CREATE POLICY "House images viewable by authenticated users"
    ON public.house_images FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Owners can manage images of their houses"
    ON public.house_images FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.houses 
            WHERE id = house_id AND (owner_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Owners can delete images of their houses"
    ON public.house_images FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.houses 
            WHERE id = house_id AND (owner_id = auth.uid() OR public.is_admin())
        )
    );

-- POLITIQUES: FAVORITES
CREATE POLICY "Users can view their own favorites"
    ON public.favorites FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
    ON public.favorites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
    ON public.favorites FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- POLITIQUES: RENTAL_REQUESTS
-- Lecture : les locataires voient leurs demandes, les propriétaires voient les demandes de leurs logements, admins voient tout
CREATE POLICY "Tenants and owners can view relevant requests"
    ON public.rental_requests FOR SELECT
    TO authenticated
    USING (
        tenant_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.houses WHERE id = house_id AND owner_id = auth.uid()) OR
        public.is_admin()
    );

-- Création : les locataires peuvent créer une demande pour eux-mêmes
CREATE POLICY "Tenants can create rental requests"
    ON public.rental_requests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = tenant_id);

-- Modification : propriétaire peut changer le statut, locataire peut annuler
CREATE POLICY "Owners and tenants can update requests"
    ON public.rental_requests FOR UPDATE
    TO authenticated
    USING (
        tenant_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.houses WHERE id = house_id AND owner_id = auth.uid()) OR
        public.is_admin()
    )
    WITH CHECK (
        tenant_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.houses WHERE id = house_id AND owner_id = auth.uid()) OR
        public.is_admin()
    );

-- 9. CONFIGURATION STORAGE BUCKET 'house-images'
-- Création automatique du bucket public si inexistant
INSERT INTO storage.buckets (id, name, public)
VALUES ('house-images', 'house-images', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques Storage
CREATE POLICY "Public read for house images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'house-images');

CREATE POLICY "Authenticated users can upload house images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'house-images');

CREATE POLICY "Users can update or delete their house images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'house-images' AND auth.uid() = owner);
