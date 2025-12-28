'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      const supabase = createClient();

      const exchangeCode = async () => {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('Error exchanging code for session:', error);
          // Clear the code from URL even if there's an error
          router.replace('/');
        } else {
          // Successfully authenticated, clear the code from URL
          router.replace('/');
          router.refresh();
        }
      };

      exchangeCode();
    }
  }, [searchParams, router]);

  return null; // This component doesn't render anything
}
