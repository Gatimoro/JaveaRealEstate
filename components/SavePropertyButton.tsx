'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useSavedProperties } from '@/lib/savedProperties';
import { useLanguage } from '@/lib/i18n';
import type { User } from '@supabase/supabase-js';

interface SavePropertyButtonProps {
  propertyId: string;
  className?: string;
}

export default function SavePropertyButton({ propertyId, className = '' }: SavePropertyButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const { toggleSaved, isSaved } = useSavedProperties();
  const { locale } = useLanguage();
  const saved = isSaved(propertyId);

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

  const translations = {
    es: {
      signInToSave: 'Inicia sesión para guardar',
      saved: 'Guardado',
      save: 'Guardar',
    },
    en: {
      signInToSave: 'Sign in to save',
      saved: 'Saved',
      save: 'Save',
    },
    ru: {
      signInToSave: 'Войдите, чтобы сохранить',
      saved: 'Сохранено',
      save: 'Сохранить',
    },
  };

  const t = translations[locale];

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) console.error('Error signing in:', error);
      return;
    }

    toggleSaved(propertyId);
  };

  return (
    <button
      onClick={handleClick}
      title={!user ? t.signInToSave : saved ? t.saved : t.save}
      className={`p-2 rounded-full transition-all hover:scale-110 ${
        saved
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
      } ${className}`}
    >
      <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
    </button>
  );
}
