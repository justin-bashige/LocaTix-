import { getSupabaseClient } from '../lib/supabase';
import { RentalRequest, RequestStatus } from '../types/database';
import { getHouseById, toggleHouseAvailability } from './houseService';
import { getCurrentUserProfile } from './authService';

const STORAGE_REQUESTS_KEY = 'locatix_rental_requests';

function getLocalRequests(): RentalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalRequests(requests: RentalRequest[]): void {
  try {
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(requests));
  } catch {}
}

function upsertLocalRequest(req: RentalRequest): void {
  const list = getLocalRequests();
  const idx = list.findIndex((r) => r.id === req.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...req };
  } else {
    list.unshift(req);
  }
  saveLocalRequests(list);
}

export async function createRentalRequest({
  tenantId,
  houseId,
  message,
}: {
  tenantId: string;
  houseId: string;
  message?: string;
}): Promise<{ request: RentalRequest | null; error: string | null }> {
  // 1. Fetch house
  const { house } = await getHouseById(houseId);

  if (!house) {
    return { request: null, error: 'Logement introuvable.' };
  }

  if (!house.is_available) {
    return { request: null, error: 'Ce logement n\'est plus disponible.' };
  }

  if (house.owner_id === tenantId) {
    return { request: null, error: 'Vous ne pouvez pas faire une demande pour votre propre logement.' };
  }

  // 2. Prevent duplicate pending requests
  const localList = getLocalRequests();
  const alreadyPending = localList.find(
    (r) => r.tenant_id === tenantId && r.house_id === houseId && r.status === 'pending'
  );
  if (alreadyPending) {
    return {
      request: null,
      error: 'Vous avez déjà une demande en attente pour ce logement.',
    };
  }

  const { profile: tenantProfile } = await getCurrentUserProfile();
  const requestId = 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();

  const newRequest: RentalRequest = {
    id: requestId,
    tenant_id: tenantId,
    house_id: houseId,
    message: message?.trim() || null,
    status: 'pending',
    created_at: now,
    updated_at: now,
    house: house,
    tenant: tenantProfile || undefined,
  };

  upsertLocalRequest(newRequest);

  // Attempt sync with remote database
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('rental_requests')
        .insert({
          id: requestId,
          tenant_id: tenantId,
          house_id: houseId,
          message: message?.trim() || null,
          status: 'pending',
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        newRequest.id = data.id;
        upsertLocalRequest(newRequest);
      }
    } catch {
      // Graceful local fallback
    }
  }

  return { request: newRequest, error: null };
}

export async function getTenantRequests(tenantId: string): Promise<{
  requests: RentalRequest[];
  error: string | null;
}> {
  let remoteRequests: RentalRequest[] = [];
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from('rental_requests')
        .select(`
          *,
          house:houses (
            *,
            images:house_images(id, image_url, created_at),
            owner:profiles!houses_owner_id_fkey(id, name, email, phone)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        remoteRequests = data as any[];
      }
    } catch {}
  }

  const localList = getLocalRequests().filter((r) => r.tenant_id === tenantId);
  const map = new Map<string, RentalRequest>();

  for (const r of remoteRequests) {
    map.set(r.id, r);
  }
  for (const r of localList) {
    map.set(r.id, r);
  }

  const results = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { requests: results, error: null };
}

export async function getOwnerRequests(ownerId: string): Promise<{
  requests: RentalRequest[];
  error: string | null;
}> {
  let remoteRequests: RentalRequest[] = [];
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data: ownerHouses } = await client
        .from('houses')
        .select('id')
        .eq('owner_id', ownerId);

      if (ownerHouses && ownerHouses.length > 0) {
        const houseIds = ownerHouses.map((h) => h.id);
        const { data, error } = await client
          .from('rental_requests')
          .select(`
            *,
            house:houses(id, title, price, location, is_available, images:house_images(id, image_url)),
            tenant:profiles!rental_requests_tenant_id_fkey(id, name, email, phone, avatar_url)
          `)
          .in('house_id', houseIds)
          .order('created_at', { ascending: false });

        if (!error && data) {
          remoteRequests = data as any[];
        }
      }
    } catch {}
  }

  const localList = getLocalRequests().filter((r) => r.house?.owner_id === ownerId);
  const map = new Map<string, RentalRequest>();

  for (const r of remoteRequests) {
    map.set(r.id, r);
  }
  for (const r of localList) {
    map.set(r.id, r);
  }

  const results = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return { requests: results, error: null };
}

export async function updateRequestStatus({
  requestId,
  status,
  houseId,
}: {
  requestId: string;
  status: RequestStatus;
  houseId?: string;
}): Promise<{ success: boolean; error: string | null }> {
  // Update local
  const localList = getLocalRequests();
  const target = localList.find((r) => r.id === requestId);
  if (target) {
    target.status = status;
    target.updated_at = new Date().toISOString();
    saveLocalRequests(localList);
  }

  if (status === 'accepted' && houseId) {
    await toggleHouseAvailability(houseId, false);
    // Auto-reject other pending requests for the same house locally
    for (const r of localList) {
      if (r.house_id === houseId && r.id !== requestId && r.status === 'pending') {
        r.status = 'rejected';
        r.updated_at = new Date().toISOString();
      }
    }
    saveLocalRequests(localList);
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client
        .from('rental_requests')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (status === 'accepted' && houseId) {
        await client
          .from('houses')
          .update({ is_available: false, updated_at: new Date().toISOString() })
          .eq('id', houseId);

        await client
          .from('rental_requests')
          .update({ status: 'rejected', updated_at: new Date().toISOString() })
          .eq('house_id', houseId)
          .eq('status', 'pending')
          .neq('id', requestId);
      }
    } catch {}
  }

  return { success: true, error: null };
}
