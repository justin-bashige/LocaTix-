import { getSupabaseClient } from '../lib/supabase';
import { House, Profile, RentalRequest, UserRole } from '../types/database';

export async function getAllProfiles(): Promise<{
  profiles: Profile[];
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) return { profiles: [], error: 'Connexion au serveur non configurée.' };

  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (error.code === 'PGRST205' || error.code === '42P01' || msg.includes('schema cache') || msg.includes('does not exist')) {
        return { profiles: [], error: null };
      }
      return { profiles: [], error: error.message };
    }
    return { profiles: (data as Profile[]) || [], error: null };
  } catch (err: any) {
    return { profiles: [], error: err?.message || 'Erreur lors de la récupération des profils.' };
  }
}

export async function getAllHousesAdmin(): Promise<{
  houses: House[];
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) return { houses: [], error: 'Connexion au serveur non configurée.' };

  try {
    const { data, error } = await client
      .from('houses')
      .select(`
        *,
        images:house_images(id, image_url, created_at),
        owner:profiles!houses_owner_id_fkey(id, name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (error.code === 'PGRST205' || error.code === '42P01' || msg.includes('schema cache') || msg.includes('does not exist')) {
        return { houses: [], error: null };
      }
      return { houses: [], error: error.message };
    }
    return { houses: (data as House[]) || [], error: null };
  } catch (err: any) {
    return { houses: [], error: err?.message || 'Erreur lors de la récupération des logements.' };
  }
}

export async function getAllRequestsAdmin(): Promise<{
  requests: RentalRequest[];
  error: string | null;
}> {
  const client = getSupabaseClient();
  if (!client) return { requests: [], error: 'Connexion au serveur non configurée.' };

  try {
    const { data, error } = await client
      .from('rental_requests')
      .select(`
        *,
        house:houses(id, title, price, location),
        tenant:profiles!rental_requests_tenant_id_fkey(id, name, email, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (error.code === 'PGRST205' || error.code === '42P01' || msg.includes('schema cache') || msg.includes('does not exist')) {
        return { requests: [], error: null };
      }
      return { requests: [], error: error.message };
    }
    return { requests: (data as any) || [], error: null };
  } catch (err: any) {
    return { requests: [], error: err?.message || 'Erreur lors de la récupération des demandes.' };
  }
}

export async function updateUserRoleAdmin(
  userId: string,
  newRole: UserRole
): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Connexion au serveur non configurée.' };

  try {
    const { error } = await client
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur lors de la mise à jour du rôle.' };
  }
}

export async function deleteHouseAdmin(houseId: string): Promise<{ success: boolean; error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Connexion au serveur non configurée.' };

  try {
    const { error } = await client.from('houses').delete().eq('id', houseId);
    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Erreur lors de la suppression du logement.' };
  }
}
