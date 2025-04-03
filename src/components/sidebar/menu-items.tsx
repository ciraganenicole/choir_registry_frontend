import { FaCalendarAlt, FaDollarSign, FaUsers } from 'react-icons/fa';
import { LuLayoutDashboard } from 'react-icons/lu';

export const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: LuLayoutDashboard,
  },
  {
    title: 'Transactions',
    path: '/transaction',
    icon: FaDollarSign,
    submenu: [
      {
        title: 'All Transactions',
        path: '/transaction',
      },
      {
        title: 'Daily Contributions',
        path: '/transaction/daily',
      },
    ],
  },
  {
    title: 'Users',
    path: '/users',
    icon: FaUsers,
  },
  {
    title: 'Attendance',
    path: '/attendance',
    icon: FaCalendarAlt,
  },
];
