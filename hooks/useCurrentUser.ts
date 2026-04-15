import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface CurrentUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export function useCurrentUser(redirectToLogin = true) {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/me');

        if (!response.ok) {
          if (redirectToLogin) {
            router.push('/login');
          }
          throw new Error('Not authenticated');
        }

        const data = await response.json();

        if (!data.user) {
          if (redirectToLogin) {
            router.push('/login');
          }
          throw new Error('No user data');
        }

        const dbUser = data.user;

        setUser({
          id: dbUser.id,
          email: dbUser.email,
          firstName: dbUser.firstName || '',
          lastName: dbUser.lastName || '',
          phone: dbUser.phone || undefined,
          // Address fields are not in the database schema yet
          // These would need to be added to User or UserProfile model
          address1: undefined,
          city: undefined,
          state: undefined,
          zipCode: undefined,
        });
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [router, redirectToLogin]);

  return { user, loading, error };
}
