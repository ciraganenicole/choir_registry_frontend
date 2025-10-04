'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Megaphone,
  Menu,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import React, { useState } from 'react';
import type { IconType } from 'react-icons';
import { FaClock, FaMusic, FaTrophy } from 'react-icons/fa';
import { IoLogoUsd } from 'react-icons/io';
import { TbLogout2 } from 'react-icons/tb';

import { UserCategory, UserRole } from '@/lib/user/type';
import { useAuth } from '@/providers/AuthProvider';

interface MenuItem {
  path: string;
  icon?: LucideIcon | IconType;
  label: string;
  roles: UserRole[];
}

interface DropdownMenuItem {
  label: string;
  icon?: LucideIcon | IconType;
  items: MenuItem[];
}

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const toggleDropdown = (dropdownLabel: string) => {
    setExpandedDropdown(
      expandedDropdown === dropdownLabel ? null : dropdownLabel,
    );
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
    {
      path: '/admin/announcements',
      icon: Megaphone,
      label: 'Annonces',
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      path: '/committee/reports',
      icon: FileText,
      label: 'Rapports',
      roles: [UserRole.SUPER_ADMIN], // Will be filtered by category in the component
    },
  ];

  const dropdownMenuItems: DropdownMenuItem[] = [
    {
      label: 'Musique',
      icon: FaMusic,
      items: [
        {
          path: '/admin/users/leads',
          icon: Users,
          label: 'Conducteurs',
          roles: [UserRole.SUPER_ADMIN],
        },
        {
          path: '/library',
          icon: FaMusic,
          label: 'Repertoire',
          roles: [UserRole.SUPER_ADMIN, UserRole.LEAD],
        },
        {
          path: '/shift',
          icon: FaClock,
          label: 'Horaire',
          roles: [UserRole.SUPER_ADMIN, UserRole.LEAD],
        },
        {
          path: '/rehearsal',
          icon: FaMusic,
          label: 'Répétitions',
          roles: [UserRole.SUPER_ADMIN, UserRole.LEAD],
        },
        {
          path: '/performance',
          icon: FaTrophy,
          label: 'Performances',
          roles: [UserRole.SUPER_ADMIN, UserRole.LEAD],
        },
      ],
    },
  ];

  // Filter menu items based on user role and categories
  const filteredMenuItems = menuItems.filter((item) => {
    if (!user) return false;

    // Check if user has the required role
    const hasRequiredRole = item.roles.includes(user.role);

    // Special case for committee reports - check for COMMITTEE category OR SUPER_ADMIN role
    if (item.path === '/committee/reports') {
      const hasCommitteeCategory = user.categories?.includes('COMMITTEE');
      const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
      return hasRequiredRole || hasCommitteeCategory || isSuperAdmin;
    }

    return hasRequiredRole;
  });

  // Filter dropdown menu items based on user role and categories
  const filteredDropdownMenuItems = dropdownMenuItems
    .map((dropdown) => ({
      ...dropdown,
      items: dropdown.items.filter((item) => {
        if (!user) return false;

        // Check if user has the required role
        const hasRequiredRole = item.roles.includes(user.role);

        // Special cases for routes that should be accessible by LEAD category
        if (item.path === '/admin/users/leads') {
          const hasLeadCategory = user.categories?.includes(UserCategory.LEAD);
          return hasRequiredRole || hasLeadCategory;
        }

        return hasRequiredRole;
      }),
    }))
    .filter((dropdown) => dropdown.items.length > 0);

  // Check if user is admin (should see dropdown) or LEAD category user (should see direct menu items)
  const isAdmin =
    user &&
    (user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ATTENDANCE_ADMIN ||
      user.role === UserRole.FINANCE_ADMIN);
  const isLeadCategory = user && user.categories?.includes(UserCategory.LEAD);

  // Get LEAD-specific menu items for direct display
  const leadMenuItems =
    isLeadCategory && dropdownMenuItems[0]
      ? dropdownMenuItems[0].items.filter(
          (item) =>
            item.roles.includes(UserRole.LEAD) ||
            item.path === '/admin/users/leads',
        )
      : [];

  const renderSidebarContent = (isMobile = false) => (
    <>
      <div>
        <nav
          className={`flex flex-col gap-4 md:gap-6 ${isMobile ? 'mt-16' : 'mt-8'}`}
        >
          {/* Regular menu items */}
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

          {/* Show dropdown only for admin users */}
          {isAdmin &&
            filteredDropdownMenuItems.map((dropdown) => (
              <div key={dropdown.label} className="space-y-1">
                <button
                  onClick={() => toggleDropdown(dropdown.label)}
                  className="flex w-full items-center justify-between rounded-lg p-2 text-white transition-colors hover:bg-gray-800 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    {dropdown.icon && (
                      <dropdown.icon className="size-6 shrink-0" />
                    )}
                    <span className="whitespace-nowrap text-base">
                      {dropdown.label}
                    </span>
                  </div>
                  {expandedDropdown === dropdown.label ? (
                    <ChevronDown className="size-4 shrink-0" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0" />
                  )}
                </button>

                {expandedDropdown === dropdown.label && (
                  <div className="ml-6 space-y-1">
                    {dropdown.items.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="flex items-center gap-3 rounded-lg p-2 text-sm text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
                        onClick={isMobile ? () => setIsOpen(false) : undefined}
                      >
                        {item.icon && <item.icon className="size-5 shrink-0" />}
                        <span className="whitespace-nowrap">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

          {/* Show direct menu items for LEAD category users */}
          {isLeadCategory &&
            leadMenuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="flex items-center gap-3 rounded-lg p-2 text-white transition-colors hover:bg-gray-800 hover:text-white"
                onClick={isMobile ? () => setIsOpen(false) : undefined}
              >
                {item.icon && <item.icon className="size-6 shrink-0" />}
                <span className="whitespace-nowrap text-base">
                  {item.label}
                </span>
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
        <div className="h-full p-2 md:p-8">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
