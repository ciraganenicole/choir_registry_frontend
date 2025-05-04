import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const checkAuth = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.accessToken) {
          setIsAuthorized(true);
        } else {
          router.push('/auth/login');
        }
      } else {
        router.push('/auth/login');
      }
    } catch (error) {
      router.push('/auth/login');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};
