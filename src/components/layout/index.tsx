'use client';

import { motion } from 'framer-motion';
import { Calendar, Home, Menu, Settings, Users, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

const Layout = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex">
      {/* Sidebar */}
      <motion.div
        animate={{ width: isOpen ? 250 : 80 }}
        className="fixed flex h-screen flex-col bg-gray-900 p-6 text-white"
      >
        <button
          className="mb-4 text-white focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className="mt-4 flex flex-col gap-8">
          <a href="/admin" className="flex items-center gap-2 text-white">
            <Home size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Dashboard</span>
          </a>
          <a
            href="/admin/users/users_list"
            className="flex items-center gap-2 text-white"
          >
            <Users size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Membres</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-white">
            <Calendar size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Attendance</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-white">
            <Settings size={24} />
            <span className={isOpen ? 'block' : 'hidden'}>Settings</span>
          </a>
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="w-full p-4 pl-24">{children}</div>
    </div>
  );
};

export default Layout;
