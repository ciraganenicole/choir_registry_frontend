'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Calendar, Home, Menu, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { IconType } from 'react-icons';
import { IoLogoUsd } from 'react-icons/io';
import { TbLogout2 } from 'react-icons/tb';

import { useAuth } from '@/providers/AuthProvider';

import InstallPrompt from '../pwa/InstallPrompt';
import OfflineIndicator from '../pwa/OfflineIndicator';

interface MenuItem {
  path: string;
  icon?: LucideIcon | IconType;
  label: string;
}

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const menuItems: MenuItem[] = [
    { path: '/admin', icon: Home, label: 'Accueil' },
    { path: '/admin/users/users_list', icon: Users, label: 'Membres' },
    { path: '/attendance', icon: Calendar, label: 'Registre' },
    { path: '/transaction', icon: IoLogoUsd, label: 'Transactions' },
  ];

  return (
    <div className="flex">
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isOpen
            ? '200px' // Mobile open width
            : '85px', // Mobile closed width
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
                {item.icon && (
                  <item.icon className="size-4 shrink-0 md:size-6" />
                )}
                <span
                  className={`${
                    isOpen ? 'block' : 'hidden'
                  } whitespace-nowrap text-sm md:text-base`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`mt-auto flex items-center justify-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-800 ${
            isOpen ? 'border-[1px] border-gray-700' : 'border-transparent'
          }`}
        >
          <TbLogout2 className="size-4 shrink-0 md:size-6" />
          <span
            className={`${
              isOpen ? 'block' : 'hidden'
            } whitespace-nowrap text-sm md:text-base`}
          >
            Se déconnecter
          </span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="min-h-screen w-full flex-1 bg-gray-300/50 pl-10 md:pl-20">
        <div className="h-full">
          {children}
          <InstallPrompt />
          <OfflineIndicator />
        </div>
      </div>
    </div>
  );
};

export default Layout;
