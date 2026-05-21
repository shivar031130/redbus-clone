'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function AuthErrorNotifier() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (error || errorCode || errorDescription) {
      // Decode URL-encoded error message
      const message = errorDescription 
        ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        : 'Authentication error occurred.';

      toast.error(`Auth Error: ${message}`, {
        duration: 6000,
      });

      // Clear the query parameters from URL without refreshing page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, router]);

  return null;
}
