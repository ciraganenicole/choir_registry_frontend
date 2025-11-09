import {
  FaBullhorn,
  FaCalendarAlt,
  FaDollarSign,
  FaFileAlt,
  FaMicrophone,
  FaMusic,
  FaPrayingHands,
  FaUsers,
} from 'react-icons/fa';
import { LuLayoutDashboard } from 'react-icons/lu';

export const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: LuLayoutDashboard,
  },
  {
    title: 'Louado',
    path: '/louado',
    icon: FaPrayingHands,
  },
  {
    title: 'Performances',
    path: '/performance',
    icon: FaMicrophone,
  },
  {
    title: 'Répétitions',
    path: '/rehearsal',
    icon: FaMusic,
  },
  {
    title: 'Bibliothèque',
    path: '/library',
    icon: FaMusic,
  },
  {
    title: 'Horaire',
    path: '/shift',
    icon: FaCalendarAlt,
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
  {
    title: 'Annonces',
    path: '/announcements',
    icon: FaBullhorn,
  },
  {
    title: 'Rapports',
    path: '/committee/reports',
    icon: FaFileAlt,
  },
];
