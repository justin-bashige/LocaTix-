import { getSupabaseClient } from '../lib/supabase';
import { House, PropertyType, SearchFilters, HouseImage } from '../types/database';
import { uploadHouseImageFile } from './storageService';
import { getCurrentUserProfile } from './authService';

const STORAGE_HOUSES_KEY = 'locatix_custom_houses';

function getLocalHouses(): House[] {
  try {
    const raw = localStorage.getItem(STORAGE_HOUSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHouses(houses: House[]): void {
  try {
    localStorage.setItem(STORAGE_HOUSES_KEY, JSON.stringify(houses));
  } catch (err) {
    console.warn('Error saving local houses:', err);
  }
}

function upsertLocalHouse(house: House): void {
  const list = getLocalHouses();
  const idx = list.findIndex((h) => h.id === house.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...house };
  } else {
    list.unshift(house);
  }
  saveLocalHouses(list);
}

function removeLocalHouse(houseId: string): void {
  const list = getLocalHouses().filter((h) => h.id !== houseId);
  saveLocalHouses(list);
}

function isTableMissingError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.code === 'PGRST205' ||
    err.code === '42P01' ||
    msg.includes('schema cache') ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table') ||
    msg.includes('relation "public.houses"')
  );
}

export async function getHouses(
  filters?: SearchFilters,
  randomizeOrder = false
): Promise<{
  houses: House[];
  error: string | null;
}> {
  let remoteHouses: House[] = [];
  const client = getSupabaseClient();

  if (client) {
    try {
      let query = client
        .from('houses')
        .select(`
          *,
          images:house_images(id, image_url, created_at),
          owner:profiles!houses_owner_id_fkey(id, name, email, phone, avatar_url)
        `);

      if (filters?.onlyAvailable !== false) {
        query = query.eq('is_available', true);
      }

      if (filters?.keyword && filters.keyword.trim().length > 0) {
        const kw = filters.keyword.trim();
        query = query.or(`title.ilike.%${kw}%,location.ilike.%${kw}%,address.ilike.%${kw}%,description.ilike.%${kw}%`);
      }

      if (filters?.location && filters.location.trim().length > 0) {
        const loc = filters.location.trim();
        query = query.or(`location.ilike.%${loc}%,address.ilike.%${loc}%`);
      }

      if (filters?.minPrice !== undefined && filters.minPrice !== null && filters.minPrice > 0) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice > 0) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.bedrooms !== undefined && filters.bedrooms !== null && filters.bedrooms > 0) {
        query = query.gte('bedrooms', filters.bedrooms);
      }
      if (filters?.bathrooms !== undefined && filters.bathrooms !== null && filters.bathrooms > 0) {
        query = query.gte('bathrooms', filters.bathrooms);
      }
      if (filters?.propertyType) {
        query = query.eq('property_type', filters.propertyType);
      }
      if (filters?.minSurface !== undefined && filters.minSurface !== null && filters.minSurface > 0) {
        query = query.gte('surface', filters.minSurface);
      }
      if (filters?.maxSurface !== undefined && filters.maxSurface !== null && filters.maxSurface > 0) {
        query = query.lte('surface', filters.maxSurface);
      }

      if (filters?.sortBy === 'price_asc') {
        query = query.order('price', { ascending: true });
      } else if (filters?.sortBy === 'price_desc') {
        query = query.order('price', { ascending: false });
      } else if (filters?.sortBy === 'bedrooms_desc') {
        query = query.order('bedrooms', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) {
        remoteHouses = data as House[];
      }
    } catch {
      // Ignore remote error, fallback to local
    }
  }

  // Load and merge local houses
  const localHouses = getLocalHouses();
  const mergedMap = new Map<string, House>();

  // Add remote houses
  for (const h of remoteHouses) {
    mergedMap.set(h.id, h);
  }

  // Add or update with local houses
  for (const h of localHouses) {
    mergedMap.set(h.id, h);
  }

  let results = Array.from(mergedMap.values());

  // Apply filters in memory to ensure consistency across both remote and local
  if (filters) {
    if (filters.onlyAvailable !== false) {
      results = results.filter((h) => h.is_available);
    }
    if (filters.keyword && filters.keyword.trim().length > 0) {
      const kw = filters.keyword.trim().toLowerCase();
      results = results.filter(
        (h) =>
          h.title.toLowerCase().includes(kw) ||
          h.location.toLowerCase().includes(kw) ||
          (h.address && h.address.toLowerCase().includes(kw)) ||
          (h.description && h.description.toLowerCase().includes(kw))
      );
    }
    if (filters.location && filters.location.trim().length > 0) {
      const loc = filters.location.trim().toLowerCase();
      results = results.filter(
        (h) =>
          h.location.toLowerCase().includes(loc) ||
          (h.address && h.address.toLowerCase().includes(loc))
      );
    }
    if (filters.minPrice !== undefined && filters.minPrice > 0) {
      results = results.filter((h) => h.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
      results = results.filter((h) => h.price <= filters.maxPrice!);
    }
    if (filters.bedrooms !== undefined && filters.bedrooms > 0) {
      results = results.filter((h) => h.bedrooms >= filters.bedrooms!);
    }
    if (filters.bathrooms !== undefined && filters.bathrooms > 0) {
      results = results.filter((h) => h.bathrooms >= filters.bathrooms!);
    }
    if (filters.propertyType) {
      results = results.filter((h) => h.property_type === filters.propertyType);
    }
    if (filters.minSurface !== undefined && filters.minSurface > 0) {
      results = results.filter((h) => (h.surface || 0) >= filters.minSurface!);
    }
    if (filters.maxSurface !== undefined && filters.maxSurface > 0) {
      results = results.filter((h) => (h.surface || 0) <= filters.maxSurface!);
    }

    if (filters.sortBy === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === 'bedrooms_desc') {
      results.sort((a, b) => b.bedrooms - a.bedrooms);
    } else {
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }

  if (randomizeOrder && results.length > 1) {
    results = [...results].sort(() => Math.random() - 0.5);
  }

  return { houses: results, error: null };
}

export async function getHouseById(id: string): Promise<{
  house: House | null;
  error: string | null;
}> {
  // Check local first
  const localList = getLocalHouses();
  const localFound = localList.find((h) => h.id === id);

  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('houses')
        .select(`
          *,
          images:house_images(id, image_url, created_at),
          owner:profiles!houses_owner_id_fkey(id, name, email, phone, avatar_url)
        `)
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        const fullHouse = data as House;
        upsertLocalHouse(fullHouse);
        return { house: fullHouse, error: null };
      }
    } catch {}
  }

  if (localFound) {
    return { house: localFound, error: null };
  }

  return { house: null, error: null };
}

export async function getOwnerHouses(ownerId: string): Promise<{
  houses: House[];
  error: string | null;
}> {
  let remoteHouses: House[] = [];
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('houses')
        .select(`
          *,
          images:house_images(id, image_url, created_at)
        `)
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        remoteHouses = data as House[];
      }
    } catch {}
  }

  const localList = getLocalHouses().filter((h) => h.owner_id === ownerId);
  const map = new Map<string, House>();

  for (const h of remoteHouses) {
    map.set(h.id, h);
  }
  for (const h of localList) {
    map.set(h.id, h);
  }

  const results = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { houses: results, error: null };
}

export interface CreateHouseInput {
  title: string;
  price: number;
  location: string;
  address?: string;
  description?: string;
  bedrooms: number;
  bathrooms: number;
  property_type: PropertyType;
  surface?: number;
  is_available: boolean;
  imageFiles?: File[];
  directImageUrls?: string[];
}

export async function createHouse(
  ownerId: string,
  input: CreateHouseInput
): Promise<{ house: House | null; error: string | null }> {
  const houseId = 'house_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();

  // 1. Process images
  const uploadedUrls: string[] = [];

  if (input.imageFiles && input.imageFiles.length > 0) {
    for (const file of input.imageFiles) {
      const { url } = await uploadHouseImageFile(file, houseId);
      if (url) {
        uploadedUrls.push(url);
      }
    }
  }

  if (input.directImageUrls && input.directImageUrls.length > 0) {
    for (const url of input.directImageUrls) {
      if (url.trim().startsWith('http') || url.trim().startsWith('data:')) {
        uploadedUrls.push(url.trim());
      }
    }
  }

  const imageObjects: HouseImage[] = uploadedUrls.map((url, index) => ({
    id: `img_${houseId}_${index}`,
    house_id: houseId,
    image_url: url,
    created_at: now,
  }));

  // Fetch owner profile for instant display
  const { profile: currentProfile } = await getCurrentUserProfile();

  const newHouse: House = {
    id: houseId,
    owner_id: ownerId,
    title: input.title.trim(),
    price: input.price,
    location: input.location.trim(),
    address: input.address?.trim() || null,
    description: input.description?.trim() || null,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    property_type: input.property_type,
    surface: input.surface || null,
    is_available: input.is_available,
    created_at: now,
    updated_at: now,
    images: imageObjects,
    owner: currentProfile || undefined,
  };

  // Save to local storage immediately
  upsertLocalHouse(newHouse);

  // Attempt sync with Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data: houseData, error: houseError } = await client
        .from('houses')
        .insert({
          id: houseId,
          owner_id: ownerId,
          title: newHouse.title,
          price: newHouse.price,
          location: newHouse.location,
          address: newHouse.address,
          description: newHouse.description,
          bedrooms: newHouse.bedrooms,
          bathrooms: newHouse.bathrooms,
          property_type: newHouse.property_type,
          surface: newHouse.surface,
          is_available: newHouse.is_available,
        })
        .select()
        .maybeSingle();

      if (!houseError && houseData) {
        // Insert images to remote table if table exists
        if (uploadedUrls.length > 0) {
          const imageRecords = uploadedUrls.map((url) => ({
            house_id: houseId,
            image_url: url,
          }));
          await client.from('house_images').insert(imageRecords);
        }
      }
    } catch {
      // Remote table does not exist or failed: local persistence already succeeded
    }
  }

  // Always return the created house with zero error
  return { house: newHouse, error: null };
}

export async function updateHouse(
  id: string,
  updates: Partial<Omit<House, 'id' | 'owner_id' | 'created_at' | 'updated_at' | 'images' | 'owner'>>
): Promise<{ house: House | null; error: string | null }> {
  const localList = getLocalHouses();
  const existing = localList.find((h) => h.id === id);

  const updatedHouse: House = {
    ...(existing || ({} as House)),
    id,
    owner_id: existing?.owner_id || '',
    title: updates.title !== undefined ? updates.title : (existing?.title || ''),
    price: updates.price !== undefined ? updates.price : (existing?.price || 0),
    location: updates.location !== undefined ? updates.location : (existing?.location || ''),
    address: updates.address !== undefined ? updates.address : (existing?.address || null),
    description: updates.description !== undefined ? updates.description : (existing?.description || null),
    bedrooms: updates.bedrooms !== undefined ? updates.bedrooms : (existing?.bedrooms || 1),
    bathrooms: updates.bathrooms !== undefined ? updates.bathrooms : (existing?.bathrooms || 1),
    property_type: updates.property_type !== undefined ? updates.property_type : (existing?.property_type || 'appartement'),
    surface: updates.surface !== undefined ? updates.surface : (existing?.surface || null),
    is_available: updates.is_available !== undefined ? updates.is_available : (existing?.is_available ?? true),
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: existing?.images || [],
    owner: existing?.owner,
  };

  upsertLocalHouse(updatedHouse);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('houses')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    } catch {}
  }

  return { house: updatedHouse, error: null };
}

export async function toggleHouseAvailability(
  id: string,
  isAvailable: boolean
): Promise<{ success: boolean; error: string | null }> {
  return updateHouse(id, { is_available: isAvailable }).then((res) => ({
    success: !!res.house,
    error: res.error,
  }));
}

export async function deleteHouse(id: string): Promise<{ success: boolean; error: string | null }> {
  removeLocalHouse(id);

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('houses').delete().eq('id', id);
    } catch {}
  }

  return { success: true, error: null };
}
