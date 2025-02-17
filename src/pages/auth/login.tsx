// pages/login.tsx
import { useRouter } from 'next/router';
import { useState } from 'react';

import Input from '@/components/input';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.status === 200 && data.message === 'Login successful') {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <h2 className="mb-6 text-center text-5xl font-extrabold text-gray-500">
        NJC
      </h2>
      <div className="w-[40%] rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-semibold text-gray-800">
          Admin Login
        </h2>

        {error && <p className="mb-4 text-center text-red-500">{error}</p>}

        <form onSubmit={handleLogin}>
          <Input
            name="email"
            label="Email"
            placeholder="Enter your email"
            onChange={(e: any) => setEmail(e)}
          />

          <Input
            name="password"
            label="Password"
            placeholder="Enter your password"
            onChange={(e: any) => setPassword(e)}
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
