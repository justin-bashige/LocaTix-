import { getSupabaseClient } from '../lib/supabase';
import { Favorite } from '../types/database';
import { getHouseById } from './houseService';

const STORAGE_FAVORITES_KEY = 'locatix_favorites';

function getLocalFavorites(): Favorite[] {
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalFavorites(favs: Favorite[]): void {
  try {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favs));
  } catch {}
}

export async function getFavorites(userId: string): Promise<{
  favorites: Favorite[];
  error: string | null;
}> {
  let remoteFavorites: Favorite[] = [];
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('favorites')
        .select(`
          id,
          user_id,
          house_id,
          created_at,
          house:houses (
            *,
            images:house_images(id, image_url, created_at),
            owner:profiles!houses_owner_id_fkey(id, name, email, phone, avatar_url)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        remoteFavorites = data as any[];
      }
    } catch {}
  }

  const localList = getLocalFavorites().filter((f) => f.user_id === userId);
  const map = new Map<string, Favorite>();

  for (const f of remoteFavorites) {
    map.set(f.house_id, f);
  }
  for (const f of localList) {
    map.set(f.house_id, f);
  }

  // Populate house details for local favorites if missing
  const results = Array.from(map.values());
  for (const fav of results) {
    if (!fav.house) {
      const { house } = await getHouseById(fav.house_id);
      if (house) fav.house = house;
    }
  }

  return { favorites: results, error: null };
}

export async function checkIsFavorite(userId: string, houseId: string): Promise<boolean> {
  const localList = getLocalFavorites();
  const exists = localList.some((f) => f.user_id === userId && f.house_id === houseId);
  if (exists) return true;

  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { data } = await client
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('house_id', houseId)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

export async function toggleFavorite(
  userId: string,
  houseId: string
): Promise<{ isFavorited: boolean; error: string | null }> {
  const localList = getLocalFavorites();
  const existingIdx = localList.findIndex((f) => f.user_id === userId && f.house_id === houseId);

  let isFavoritedNow = false;

  if (existingIdx >= 0) {
    localList.splice(existingIdx, 1);
    isFavoritedNow = false;
  } else {
    const { house } = await getHouseById(houseId);
    localList.unshift({
      id: 'fav_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      house_id: houseId,
      created_at: new Date().toISOString(),
      house: house || undefined,
    });
    isFavoritedNow = true;
  }

  saveLocalFavorites(localList);

  const client = getSupabaseClient();
  if (client) {
    try {
      if (isFavoritedNow) {
        await client.from('favorites').insert({
          user_id: userId,
          house_id: houseId,
        });
      } else {
        await client
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('house_id', houseId);
      }
    } catch {}
  }

  return { isFavorited: isFavoritedNow, error: null };
}
