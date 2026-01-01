'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface SavedPropertiesContextType {
  savedProperties: string[];
  toggleSaved: (propertyId: string) => Promise<void>;
  isSaved: (propertyId: string) => boolean;
  isLoading: boolean;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // Load saved properties from Supabase when user logs in
  useEffect(() => {
    const loadSavedProperties = async () => {
      if (!user) {
        setSavedProperties([]);
        setIsLoading(false);
        return;
      }

      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from('saved_properties')
          .select('property_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error loading saved properties:', error);
          return;
        }

        const propertyIds = data?.map(item => item.property_id) || [];
        setSavedProperties(propertyIds);
      } catch (error) {
        console.error('Error loading saved properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedProperties();
  }, [user]);

  const toggleSaved = async (propertyId: string) => {
    if (!user) return;

    const supabase = createClient();
    const currentlySaved = savedProperties.includes(propertyId);

    try {
      if (currentlySaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_properties')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', propertyId);

        if (error) throw error;

        setSavedProperties(prev => prev.filter(id => id !== propertyId));
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_properties')
          .insert({
            user_id: user.id,
            property_id: propertyId,
          });

        if (error) throw error;

        setSavedProperties(prev => [...prev, propertyId]);
      }
    } catch (error) {
      console.error('Error toggling saved property:', error);
    }
  };

  const isSaved = (propertyId: string) => {
    return savedProperties.includes(propertyId);
  };

  return (
    <SavedPropertiesContext.Provider value={{ savedProperties, toggleSaved, isSaved, isLoading }}>
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
