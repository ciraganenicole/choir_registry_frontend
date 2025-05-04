import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  user: any | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  user: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const login = (token: string, userData: any) => {
    const authData = { ...userData, accessToken: token };
    localStorage.setItem('user', JSON.stringify(authData));
    setIsAuthenticated(true);
    setUser(authData);
  };

  const logout = async () => {
    // Clear all auth-related data
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Unregister service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      // Use Promise.all to handle all unregistrations in parallel
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName)),
      );
    }

    // Force a hard reload to clear any cached state
    window.location.href = '/auth/login';
  };

  const initializeAuth = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.accessToken) {
          setIsAuthenticated(true);
          setUser(userData);
        }
      }
    } catch (error) {
      // Handle error silently and reset auth state
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated,
      login,
      logout,
      user,
      isLoading,
    }),
    [isAuthenticated, user, isLoading],
  );

  if (isLoading) {
    return null; // or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
