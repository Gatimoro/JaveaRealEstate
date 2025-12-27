'use client';

import { Heart } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { useSavedProperties } from '@/lib/savedProperties';
import { useLanguage } from '@/lib/i18n';

interface SavePropertyButtonProps {
  propertyId: string;
  className?: string;
}

export default function SavePropertyButton({ propertyId, className = '' }: SavePropertyButtonProps) {
  const { data: session } = useSession();
  const { toggleSaved, isSaved } = useSavedProperties();
  const { locale } = useLanguage();
  const saved = isSaved(propertyId);

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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      signIn('google');
      return;
    }

    toggleSaved(propertyId);
  };

  return (
    <button
      onClick={handleClick}
      title={!session ? t.signInToSave : saved ? t.saved : t.save}
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
