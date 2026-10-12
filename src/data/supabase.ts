import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Same project as the Windows app. The anon/publishable key is safe to ship in the app;
// row-level security on the tables protects each user's data.
export const SUPABASE_URL = 'https://haeyoyzkdbzyqdbtxunj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_zKGtqCEbHwRuCHtbNWDAwg_I8VI65sH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
