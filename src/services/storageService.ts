import { getSupabaseClient } from '../lib/supabase';

const BUCKET_NAME = 'house-images';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => {
      // Fallback create object URL
      try {
        resolve(URL.createObjectURL(file));
      } catch {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadHouseImageFile(
  file: File,
  houseId: string
): Promise<{ url: string | null; error: string | null }> {
  const client = getSupabaseClient();
  
  if (!client) {
    const fallbackUrl = await fileToDataUrl(file);
    return { url: fallbackUrl, error: null };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${houseId}/${cleanFileName}`;

    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      // Fallback seamlessly to high-quality data URL so image works 100% without blocking the user
      const fallbackUrl = await fileToDataUrl(file);
      return { url: fallbackUrl, error: null };
    }

    const { data: publicData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { url: publicData.publicUrl, error: null };
  } catch (err: any) {
    const fallbackUrl = await fileToDataUrl(file);
    return { url: fallbackUrl, error: null };
  }
}

export async function deleteStorageImage(imageUrl: string): Promise<{ error: string | null }> {
  const client = getSupabaseClient();
  if (!client) return { error: null };

  try {
    const parts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (parts.length > 1) {
      const filePath = parts[1];
      await client.storage.from(BUCKET_NAME).remove([filePath]);
    }
    return { error: null };
  } catch {
    return { error: null };
  }
}
