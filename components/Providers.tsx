'use client';

import { LanguageProvider } from '@/lib/i18n';
import { SavedPropertiesProvider } from '@/lib/savedProperties';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SavedPropertiesProvider>
        {children}
      </SavedPropertiesProvider>
    </LanguageProvider>
  );
}
