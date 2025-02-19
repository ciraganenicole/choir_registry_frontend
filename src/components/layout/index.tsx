'use client';

import { motion } from 'framer-motion';
import { Calendar, Home, Menu, Settings, Users, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { TbLogout2 } from 'react-icons/tb';

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Add your logout logic here, e.g., clearing session or tokens
    console.log('Logged out');
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isOpen ? 250 : 80 }}
        className="fixed flex h-screen flex-col bg-gray-900 px-6 py-8 text-white"
      >
        <button
          className="mb-4 text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="mt-8 flex flex-col gap-8">
          <Link href="/admin" className="flex items-center gap-2 text-white">
            <Home size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Dashboard</span>
          </Link>
          <Link
            href="/admin/users/users_list"
            className="flex items-center gap-2 text-white"
          >
            <Users size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Membres</span>
          </Link>
          <Link
            href="/attendance/weekly_attendance"
            className="flex items-center gap-2 text-white"
          >
            <Calendar size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Attendance</span>
          </Link>
          <Link href="#" className="flex items-center gap-2 text-white">
            <Settings size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Settings</span>
          </Link>
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={`mt-auto flex items-center justify-center gap-3 rounded-md border-[1px] px-6 py-2 text-center text-white ${
            isOpen ? 'border-white' : 'border-transparent'
          }`}
        >
          <TbLogout2 size={24} />
          <span className={isOpen ? 'block' : 'hidden'}>Logout</span>
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="h-screen w-full bg-gray-300/50 pl-20">{children}</div>
    </div>
  );
};

export default Layout;
