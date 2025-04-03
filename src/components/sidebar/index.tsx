import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';

import { menuItems } from './menu-items';

const Sidebar = () => {
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isActive = (path: string) => router.pathname === path;
  const isSubmenuActive = (submenuPath: string) =>
    router.pathname.startsWith(submenuPath);

  return (
    <div className="h-full bg-white shadow-sm">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold">Admin Panel</h1>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() =>
                      setExpandedMenu(
                        expandedMenu === item.path ? null : item.path,
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-md px-4 py-2 ${
                      isSubmenuActive(item.path)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      {item.icon && (
                        <item.icon className="mr-3 size-5 text-gray-400" />
                      )}
                      <span>{item.title}</span>
                    </div>
                    {expandedMenu === item.path ? (
                      <FaChevronDown className="size-3" />
                    ) : (
                      <FaChevronRight className="size-3" />
                    )}
                  </button>
                  {expandedMenu === item.path && (
                    <ul className="ml-6 mt-2 space-y-1">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            href={subItem.path}
                            className={`block rounded-md px-4 py-2 ${
                              isActive(subItem.path)
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={`flex items-center rounded-md px-4 py-2 ${
                    isActive(item.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon && (
                    <item.icon className="mr-3 size-5 text-gray-400" />
                  )}
                  <span>{item.title}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
