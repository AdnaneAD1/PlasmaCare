import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: {
      getItem: (key) => {
        // Vérification renforcée du localStorage
        const item = localStorage.getItem(key);
        console.log(`Storage get ${key}:`, item?.substring(0, 20) + '...');
        return item;
      },
      setItem: (key, value) => {
        console.log(`Storage set ${key}:`, value.substring(0, 20) + '...');
        localStorage.setItem(key, value);
      },
      removeItem: (key) => {
        console.log(`Storage remove ${key}`);
        localStorage.removeItem(key);
      }
    }
  }
});