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

import { UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

import InstallPrompt from '../pwa/InstallPrompt';
import OfflineIndicator from '../pwa/OfflineIndicator';

interface MenuItem {
  path: string;
  icon?: LucideIcon | IconType;
  label: string;
  roles: UserRole[];
}

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const menuItems: MenuItem[] = [
    {
      path: '/admin',
      icon: Home,
      label: 'Accueil',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      path: '/admin/users',
      icon: Users,
      label: 'Membres',
      roles: [
        UserRole.SUPER_ADMIN,
        UserRole.ATTENDANCE_ADMIN,
        UserRole.FINANCE_ADMIN,
      ],
    },
    {
      path: '/attendance',
      icon: Calendar,
      label: 'Registre',
      roles: [UserRole.SUPER_ADMIN, UserRole.ATTENDANCE_ADMIN],
    },
    {
      path: '/transaction',
      icon: IoLogoUsd,
      label: 'Transactions',
      roles: [UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN],
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role),
  );

  const renderSidebarContent = (isMobile = false) => (
    <>
      <div>
        <nav className={`flex flex-col gap-4 ${isMobile ? 'mt-16' : 'mt-8'}`}>
          {filteredMenuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-3 rounded-lg p-2 text-white transition-colors hover:bg-gray-800 hover:text-white"
              onClick={isMobile ? () => setIsOpen(false) : undefined}
            >
              {item.icon && <item.icon className="size-6 shrink-0" />}
              <span className="whitespace-nowrap text-base">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-lg border border-gray-700 p-2 text-white transition-colors hover:bg-gray-800 hover:text-white"
      >
        <TbLogout2 className="size-6 shrink-0" />
        <span className="whitespace-nowrap text-base">Se déconnecter</span>
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile Menu Button */}
      <button
        className="fixed left-8 z-50 my-3 rounded-lg bg-gray-900 p-2 text-white md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="size-6" /> : <Menu className="h-4 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col justify-between bg-gray-900 px-4 py-6 text-white md:sticky md:flex">
        {renderSidebarContent()}
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={false}
        animate={{
          translateX: isOpen ? '0%' : '-100%',
        }}
        className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col justify-between bg-gray-900 px-4 py-6 text-white transition-all duration-300 md:hidden"
      >
        {renderSidebarContent(true)}
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 bg-gray-300 md:bg-gray-100">
        <div className="h-full p-2 md:p-8">
          {children}
          <InstallPrompt />
          <OfflineIndicator />
        </div>
      </div>
    </div>
  );
};

export default Layout;
