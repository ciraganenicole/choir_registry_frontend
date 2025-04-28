import { useRouter } from 'next/router';
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
  const router = useRouter();

  const login = (token: string, userData: any) => {
    const authData = { ...userData, access_token: token };
    localStorage.setItem('user', JSON.stringify(authData));
    setIsAuthenticated(true);
    setUser(authData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/auth/login');
  };

  const initializeAuth = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.access_token) {
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
