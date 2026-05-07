import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL missing');
}
if (!serviceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY missing');
}

export const supabaseAdmin = createClient<Database>(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
