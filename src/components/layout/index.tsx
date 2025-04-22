'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Calendar, Home, Menu, Users, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';
import type { IconType } from 'react-icons';
import { IoLogoUsd } from 'react-icons/io';
import { TbLogout2 } from 'react-icons/tb';

import { API_URL } from '@/config/api';
import { showNotification } from '@/utils/notifications';

import InstallPrompt from '../pwa/InstallPrompt';
import OfflineIndicator from '../pwa/OfflineIndicator';

interface MenuItem {
  path: string;
  icon?: LucideIcon | IconType;
  label: string;
}

const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/check`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Authentication check failed');
        }

        setIsLoading(false);
      } catch (err) {
        showNotification('Session expired. Please login again.', 'error');
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    showNotification('Logged out successfully', 'success');
    router.push('/login');
  };

  const menuItems: MenuItem[] = [
    { path: '/admin', icon: Home, label: 'Accueil' },
    { path: '/admin/users/users_list', icon: Users, label: 'Membres' },
    { path: '/attendance', icon: Calendar, label: 'Registre' },
    { path: '/transaction', icon: IoLogoUsd, label: 'Transactions' },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen ? '200px' : '85px',
        }}
        className="fixed z-30 flex h-screen flex-col justify-between bg-gray-900 px-2 py-4 text-white transition-all duration-300 md:px-6 md:py-8"
      >
        <div>
          <button
            className="mb-4 flex size-8 items-center justify-center rounded-lg hover:bg-gray-800 focus:outline-none md:size-10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="size-4 md:size-6" />
            ) : (
              <Menu className="size-4 md:size-6" />
            )}
          </button>

          <nav className="mt-4 flex flex-col gap-4 md:mt-8 md:gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="flex items-center gap-3 rounded-lg p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                {item.icon && <item.icon className="size-4 md:size-6" />}
                <span
                  className={`whitespace-nowrap ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                  } transition-opacity duration-300 md:opacity-100`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <TbLogout2 className="size-4 md:size-6" />
          <span
            className={`whitespace-nowrap ${
              isOpen ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-300 md:opacity-100`}
          >
            Déconnexion
          </span>
        </button>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 pl-[85px] md:pl-[200px]">
        <div className="container mx-auto p-4">
          <InstallPrompt />
          <OfflineIndicator />
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
