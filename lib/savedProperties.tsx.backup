'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SavedPropertiesContextType {
  savedProperties: string[];
  toggleSaved: (propertyId: string) => void;
  isSaved: (propertyId: string) => boolean;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);

  // Get user and subscribe to auth changes
  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load saved properties from localStorage when user logs in
  useEffect(() => {
    if (user?.email) {
      const key = `saved_properties_${user.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setSavedProperties(JSON.parse(saved));
      }
    } else {
      setSavedProperties([]);
    }
  }, [user]);

  const toggleSaved = (propertyId: string) => {
    if (!user?.email) return;

    const key = `saved_properties_${user.email}`;
    const newSaved = savedProperties.includes(propertyId)
      ? savedProperties.filter(id => id !== propertyId)
      : [...savedProperties, propertyId];

    setSavedProperties(newSaved);
    localStorage.setItem(key, JSON.stringify(newSaved));
  };

  const isSaved = (propertyId: string) => {
    return savedProperties.includes(propertyId);
  };

  return (
    <SavedPropertiesContext.Provider value={{ savedProperties, toggleSaved, isSaved }}>
      {children}
    </SavedPropertiesContext.Provider>
  );
}

export function useSavedProperties() {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error('useSavedProperties must be used within SavedPropertiesProvider');
  }
  return context;
}
