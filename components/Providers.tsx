'use client';

import { LanguageProvider } from '@/lib/i18n';
import { SavedPropertiesProvider } from '@/lib/savedProperties';
import AuthCallback from '@/components/AuthCallback';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SavedPropertiesProvider>
        <AuthCallback />
        {children}
      </SavedPropertiesProvider>
    </LanguageProvider>
  );
}
