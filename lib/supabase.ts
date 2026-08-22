import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aqnuboniapnxolhyflzc.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxbnVib25pYXBueG9saHlmbHpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMzcyODksImV4cCI6MjEwMjgxMzI4OX0.nURUTYcI5tO4PdmhacJgphWDJ2l41E_iRpw-LfaR7NQ';

const memoryStorage: Record<string, string> = {};

const customStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      return memoryStorage[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      memoryStorage[key] = value;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      delete memoryStorage[key];
    }
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
