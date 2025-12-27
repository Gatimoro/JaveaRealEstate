'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface SavedPropertiesContextType {
  savedProperties: string[];
  toggleSaved: (propertyId: string) => void;
  isSaved: (propertyId: string) => boolean;
}

const SavedPropertiesContext = createContext<SavedPropertiesContextType | undefined>(undefined);

export function SavedPropertiesProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [savedProperties, setSavedProperties] = useState<string[]>([]);

  // Load saved properties from localStorage when user logs in
  useEffect(() => {
    if (session?.user?.email) {
      const key = `saved_properties_${session.user.email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setSavedProperties(JSON.parse(saved));
      }
    } else {
      setSavedProperties([]);
    }
  }, [session]);

  const toggleSaved = (propertyId: string) => {
    if (!session?.user?.email) return;

    const key = `saved_properties_${session.user.email}`;
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
