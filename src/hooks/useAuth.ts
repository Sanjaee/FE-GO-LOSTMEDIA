import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export const useAuth = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading';
  const isUnauthenticated = status === 'unauthenticated';

  // Get access token from session
  const getAccessToken = () => {
    return session?.accessToken || null;
  };

  // Get refresh token from session
  const getRefreshToken = () => {
    return session?.refreshToken || null;
  };

  // Check if user is verified
  const isVerified = session?.isVerified || false;

  // Utility function to redirect if not authenticated (call manually or use useRequireAuth hook)
  const requireAuth = (redirectTo: string = '/auth/login') => {
    if (isUnauthenticated) {
      router.push(redirectTo);
    }
  };

  // Utility function to redirect if authenticated (call manually or use useRedirectIfAuthenticated hook)
  const redirectIfAuthenticated = (redirectTo: string = '/') => {
    if (isAuthenticated) {
      router.push(redirectTo);
    }
  };

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    isUnauthenticated,
    isVerified,
    getAccessToken,
    getRefreshToken,
    requireAuth,
    redirectIfAuthenticated,
    user: session?.user || null,
  };
};
