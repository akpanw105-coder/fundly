import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://jvdltdlitbuqqjkeeqgq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2ZGx0ZGxpdGJ1cXFqa2VlcWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MTIzMjQsImV4cCI6MjEwODE4ODMyNH0.utZENTAwU1z0Nx3X-8TMobSMlT1fOQ7iCQkGbw7e5ys';

/**
 * SSR-safe storage adapter.
 *
 * During static rendering (Expo web SSR / Node.js), `window` is not defined.
 * Accessing `window.localStorage` directly — even behind a typeof-check on the
 * *object* — throws because the `storage` getter on Supabase's internal
 * LocalStorage class calls `window.localStorage` at access-time.
 *
 * This adapter defers all storage calls to either:
 *  - `window.localStorage`  on web (browser runtime)
 *  - `AsyncStorage`          on native (iOS / Android)
 *  - a no-op / null stub     in SSR / Node.js (no window)
 */
const webLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  },
};

const storage = Platform.OS === 'web' ? webLocalStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
