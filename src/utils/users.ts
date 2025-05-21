import type { User } from '@/lib/user/type';

export const sortUsers = (users: User[]): User[] => {
  return [...users].sort((a, b) => {
    const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
};

export const filterUsers = (users: User[], searchQuery: string): User[] => {
  const lowerCaseQuery = searchQuery.toLowerCase();
  return users.filter((user) =>
    [
      `${user.lastName} ${user.firstName}`,
      user.matricule,
      user.phoneNumber,
    ].some((field) => field?.toLowerCase().includes(lowerCaseQuery)),
  );
};
