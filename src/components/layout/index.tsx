'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Calendar, FileText, Home, Menu, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import type { IconType } from 'react-icons';
import { IoLogoUsd } from 'react-icons/io';
import { TbLogout2 } from 'react-icons/tb';

interface MenuItem {
  path: string;
  icon?: LucideIcon | IconType;
  label: string;
}

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    console.log('Logged out');
  };

  const menuItems: MenuItem[] = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/users/users_list', icon: Users, label: 'Membres' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/leave/leaves', icon: FileText, label: 'Leave' },
    { path: '/transaction', icon: IoLogoUsd, label: 'All Transactions' },
  ];

  return (
    <div>
      {/* Sidebar */}
      <motion.div
        animate={{ width: isOpen ? 250 : 80 }}
        className="fixed flex h-full flex-col justify-between bg-gray-900 px-6 py-8 text-white"
      >
        <button
          className="mb-4 text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="mt-8 flex flex-col gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center gap-2 text-white"
            >
              {item.icon && <item.icon size={24} />}
              <span className={isOpen ? 'block' : 'hidden'}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`mt-auto flex items-center justify-center gap-3 rounded-md border-[1px] px-6 py-2 text-center text-white ${
            isOpen ? 'border-white' : 'border-transparent'
          }`}
        >
          <TbLogout2 size={24} />
          <span className={isOpen ? 'flex' : 'hidden'}>Logout</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="size-full bg-gray-300/50 pl-20">{children}</div>
    </div>
  );
};

export default Layout;
