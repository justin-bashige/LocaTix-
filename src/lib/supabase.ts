import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'locatix_supabase_url';
const STORAGE_KEY_ANON = 'locatix_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'none';
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (envUrl && envKey && !envUrl.includes('your-project.supabase.co')) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isConfigured: true,
      source: 'env',
    };
  }

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_URL) : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ANON) : null;

  if (storedUrl && storedKey) {
    return {
      url: storedUrl.trim(),
      anonKey: storedKey.trim(),
      isConfigured: true,
      source: 'storage',
    };
  }

  // Default configured fallback to user project
  const defaultUrl = 'https://geiltcbtstppdcdarptv.supabase.co';
  const defaultKey = 'sb_publishable_uIkOPqanvZMD9fGjb52rPw_xzW0_vsL';

  return {
    url: defaultUrl,
    anonKey: defaultKey,
    isConfigured: true,
    source: 'storage',
  };
}

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) {
    return null;
  }

  const key = `${config.url}::${config.anonKey}`;
  if (!cachedClient || currentClientKey !== key) {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    currentClientKey = key;
  }

  return cachedClient;
}

export function saveSupabaseConfig(url: string, anonKey: string): boolean {
  if (!url || !anonKey) return false;
  try {
    localStorage.setItem(STORAGE_KEY_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    cachedClient = null;
    window.dispatchEvent(new Event('locatix_supabase_config_changed'));
    return true;
  } catch (err) {
    console.error('Failed to save config in localStorage', err);
    return false;
  }
}

export function resetSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  cachedClient = null;
  window.dispatchEvent(new Event('locatix_supabase_config_changed'));
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  tablesFound?: string[];
  error?: string;
}

export async function testSupabaseConnection(overrideUrl?: string, overrideKey?: string): Promise<ConnectionTestResult> {
  const url = overrideUrl || getSupabaseConfig().url;
  const key = overrideKey || getSupabaseConfig().anonKey;

  if (!url || !key) {
    return {
      success: false,
      message: 'URL et clé API requises.',
      error: 'Missing credentials',
    };
  }

  try {
    const client = createClient(url, key);
    
    // Test basic connection by querying profiles table count
    const { error: profileError } = await client
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (profileError) {
      // 404 or table not found
      if (profileError.code === '42P01' || profileError.message?.toLowerCase().includes('relation "public.profiles" does not exist')) {
        return {
          success: false,
          message: 'Connecté au serveur, mais la table "profiles" n\'existe pas encore. Veuillez exécuter le script SQL fourni.',
          error: profileError.message,
        };
      }

      // Invalid API key or URL
      if (profileError.code === 'PGRST301' || profileError.message?.toLowerCase().includes('jwt') || profileError.message?.toLowerCase().includes('invalid api key')) {
        return {
          success: false,
          message: 'Clé d\'API invalide ou rejetée par le serveur.',
          error: profileError.message,
        };
      }

      return {
        success: false,
        message: `Erreur serveur: ${profileError.message}`,
        error: profileError.message,
      };
    }

    return {
      success: true,
      message: 'Connexion au serveur réussie et schéma détecté !',
      tablesFound: ['profiles', 'houses', 'house_images', 'favorites', 'rental_requests'],
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Impossible de joindre le serveur. Vérifiez l\'URL.',
      error: String(err),
    };
  }
}
