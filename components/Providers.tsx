'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/lib/i18n';
import { SavedPropertiesProvider } from '@/lib/savedProperties';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <SavedPropertiesProvider>
          {children}
        </SavedPropertiesProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
