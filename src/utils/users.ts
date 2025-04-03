import type { User } from '@/pages/admin/users/type';

export const sortUsers = (users: User[]): User[] => {
  return [...users].sort((a, b) => {
    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
};

export const filterUsers = (users: User[], searchQuery: string): User[] => {
  const lowerCaseQuery = searchQuery.toLowerCase();
  return users.filter((user) =>
    [
      `${user.firstName} ${user.lastName}`,
      user.matricule,
      user.phoneNumber,
    ].some((field) => field.toLowerCase().includes(lowerCaseQuery)),
  );
};
