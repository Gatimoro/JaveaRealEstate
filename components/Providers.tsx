'use client';

import { Suspense } from 'react';
import { LanguageProvider } from '@/lib/i18n';
import { SavedPropertiesProvider } from '@/lib/savedProperties';
import AuthCallback from '@/components/AuthCallback';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SavedPropertiesProvider>
        <Suspense fallback={null}>
          <AuthCallback />
        </Suspense>
        {children}
      </SavedPropertiesProvider>
    </LanguageProvider>
  );
}
