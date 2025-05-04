// pages/login.tsx
import { useRouter } from 'next/router';
import { useState } from 'react';

import Input from '@/components/input';
import { API_URL } from '@/config/api';
import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const getRedirectPath = (role: UserRole) => {
    switch (role) {
      case UserRole.FINANCE_ADMIN:
        return '/transaction';
      case UserRole.ATTENDANCE_ADMIN:
        return '/attendance';
      case UserRole.SUPER_ADMIN:
        return '/admin';
      case UserRole.USER:
        return '/profile';
      default:
        return '/users';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    try {
      // Clear any existing auth data before attempting to login
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.accessToken || !data.user) {
        throw new Error('Invalid response from server');
      }

      // Use the AuthProvider's login function
      login(data.accessToken, data.user);

      // Use setTimeout to ensure state updates are processed
      setTimeout(() => {
        const redirectPath = getRedirectPath(data.user.role);
        router.push(redirectPath);
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred',
      );
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 flex flex-row items-center text-center text-5xl font-extrabold text-gray-400">
        <img src="/assets/images/Wlogo.png" alt="logo" className="h-20 w-32 " />
        <span>NJC</span>
      </h2>
      <div className="w-[90%] rounded-lg bg-white p-8 shadow-md md:w-[60%] lg:w-[40%]">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Admin Login
        </h2>

        {error && <p className="mb-4 text-center text-red-500">{error}</p>}

        <form onSubmit={handleLogin}>
          <Input
            type="email"
            name="email"
            label="Email"
            value={email}
            placeholder="Enter your email"
            onChange={setEmail}
          />

          <Input
            type="password"
            name="password"
            label="Password"
            value={password}
            placeholder="Enter your password"
            onChange={setPassword}
          />

          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
