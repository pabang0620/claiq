import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

export const supabase = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  {
    auth: { persistSession: false },
  }
)

export const uploadToStorage = async (bucket, path, buffer, contentType) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    })
  if (error) throw error
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}
