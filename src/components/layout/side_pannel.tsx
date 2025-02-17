import Link from 'next/link';
import type { FC } from 'react';
import React from 'react';
import {
  BiBookAlt,
  BiChevronLeft,
  BiHomeAlt,
  BiMenu,
  BiUser,
} from 'react-icons/bi';
import { MdOutlineAttachMoney } from 'react-icons/md';
// import { logout } from "../../utils/auth";

interface SideBarProps {
  mobileOpenned: boolean;
  toogleMobileSidebar: () => void;
  activeMenu?: string;
}

interface MobileSideBarProps {
  toogleMobileSidebar: () => void;
}

const menus = [
  {
    name: 'Acceuil',
    icon: <BiHomeAlt size={18} color="text-primary50" />,
    link: '/',
  },
  {
    name: 'Mes Fiches',
    icon: <BiBookAlt size={18} color="text-[#0E9F90]" />,
    link: '/fiches',
  },
  {
    name: 'Paiements',
    icon: (
      <MdOutlineAttachMoney
        size={18}
        color="text-primary50"
        className="ml-[-3px]"
      />
    ),
    link: '/payments',
  },
  {
    name: 'Profile',
    icon: <BiUser size={18} color="text-primary50" />,
    link: '/profile',
  },
  {
    name: 'Mes situations',
    icon: <BiUser size={18} color="text-primary50" />,
    link: '/adminsituation',
  },
  {
    name: 'Prompts',
    icon: <BiUser size={18} color="text-primary50" />,
    link: '/adminprompt',
  },
  {
    name: 'Fichier',
    icon: <BiUser size={18} color="text-primary50" />,
    link: '/adminfichier',
  },
];

const Sidebar: FC<SideBarProps> = ({
  toogleMobileSidebar,
  mobileOpenned,
  activeMenu = 'Acceuil',
}) => {
  return (
    <div
      className={`fixed z-[100] flex h-screen min-w-[250px] flex-col justify-between bg-orange-500 p-8 shadow-md sm:fixed  
    ${mobileOpenned ? 'sm:visible' : 'sm:hidden'}`}
    >
      <div className="">
        <div className="flex flex-row items-center sm:justify-between">
          {/* <img src={logo} width={60} className="rounded-[50px] sm:hidden" /> */}
          <div className="bg-primary50 rounded-[5px] px-3">
            <BiChevronLeft
              size={30}
              color="text-[#fff]"
              className="text-[#fff]  md:hidden"
              onClick={() => {
                toogleMobileSidebar();
              }}
            />
          </div>
        </div>
        <ul className="mt-16 flex flex-col gap-8">
          {menus.map((menu) => (
            <li
              className={`${
                menu.name === activeMenu
                  ? 'rounded-[5px] bg-[#000] bg-opacity-10 p-2'
                  : 'px-2'
              } `}
            >
              <Link
                href={menu.link || '#'}
                className="flex flex-row items-center gap-2"
              >
                {menu.icon}
                <p className="text-[16px]">{menu.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* <div>
        <Button
          label={"Deconnexion"}
          onClick={() => {
            logout();
          }}
          width="min-w-[195px] text-[14px] rounded-[7px] ml-[-0px] mt-auto "
          borderRadius="10px"
          height="h-[35px]"
        />
      </div> */}
    </div>
  );
};

export const MobileSidebar: FC<MobileSideBarProps> = (props) => {
  return (
    <div className="fixed z-10 h-[50px] w-full bg-[#FFF8F6] px-4 pt-4 md:hidden">
      <div className="flex flex-row items-center gap-3">
        <BiMenu
          size={25}
          color="text-primary50"
          onClick={() => {
            props.toogleMobileSidebar();
          }}
        />
        <h1 className="text-sm font-bold">Dug Assistant</h1>
      </div>
    </div>
  );
};

export default Sidebar;
