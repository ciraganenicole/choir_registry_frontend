import { useState } from 'react';

import SearchInput from '@/components/filters/search';
import Layout from '@/components/layout';
import Pagination from '@/components/pagination';
import { filterUsers, sortUsers } from '@/utils/users';

import { useAttendance } from './logic';

const AttendanceTable = () => {
  const { users } = useAttendance();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 8;

  const getWeekDates = (): string[] => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.toISOString().split('T')[0] || '';
    });
  };
  const weekDates = getWeekDates();
  const filteredUsers = filterUsers(users, searchQuery);
  const sortedUsers = sortUsers(filteredUsers);
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // const getCredential = async (): Promise<Credential | null> => {
  //   // Set up the WebAuthn request options
  //   const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
  //     {
  //       challenge: new Uint8Array([
  //         /* The challenge from the server */
  //       ]),
  //       allowCredentials: [
  //         {
  //           id: new Uint8Array([
  //             /* The credential ID, typically stored during registration */
  //           ]),
  //           type: 'public-key' as 'public-key',
  //         },
  //       ],
  //       timeout: 60000,
  //       userVerification: 'preferred',
  //     };

  //   try {
  //     const credential = await navigator.credentials.get({
  //       publicKey: publicKeyCredentialRequestOptions,
  //     });

  //     // Check if credential is null
  //     if (credential === null) {
  //       console.error('No credential returned.');
  //       return null; // Returning null when credential is not obtained
  //     }

  //     return credential;
  //   } catch (error) {
  //     console.error('Error getting WebAuthn credential:', error);
  //     return null; // Return null in case of error
  //   }
  // };

  // const handleFingerprintScan = async (userId: number) => {
  //   try {
  //     console.log(`Starting fingerprint scan for user ${userId}...`);

  //     if (!window.PublicKeyCredential) {
  //       console.error('WebAuthn is not supported in this browser.');
  //       return;
  //     }

  //     // Step 1: Get authentication challenge from the backend
  //     const resp = await fetch(
  //       'http://localhost:4000/webauthn/authenticate-challenge',
  //       {
  //         method: 'POST',
  //         body: JSON.stringify({ userId }),
  //         headers: { 'Content-Type': 'application/json' },
  //       }
  //     );

  //     const challengeData = await resp.json();
  //     console.log('Authentication Challenge:', challengeData);

  //     const credential = await startAuthentication(challengeData);
  //     console.log('Authentication Credential:', credential);

  //     const verificationResp = await fetch(
  //       'http://localhost:4000/webauthn/verify-authentication',
  //       {
  //         method: 'POST',
  //         body: JSON.stringify({ userId, credential }),
  //         headers: { 'Content-Type': 'application/json' },
  //       }
  //     );

  //     const verificationData = await verificationResp.json();

  //     if (verificationData.success) {
  //       console.log('Fingerprint authentication successful!');
  //       markAttendance(userId, credential);
  //     } else {
  //       console.error('Fingerprint authentication failed.');
  //     }
  //   } catch (error) {
  //     console.error('Error during WebAuthn authentication:', error);
  //   }
  // };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Layout>
      <div className="p-4 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between py-4">
          <h2 className="text-2xl font-semibold">Registre</h2>

          <div className="itams-center flex flex-row gap-4">
            <SearchInput onSearch={handleSearch} />
            <div className="flex flex-col items-center gap-2 font-semibold">
              <p className="text-[12px]">✅ Present</p>
              <p className="text-[12px]">❌ Absent</p>
            </div>
          </div>
        </div>

        <div className="mb-4 rounded-md border-[2px] border-gray-400 bg-white p-[4px] shadow-sm">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-400">
                <th className="rounded-tl-md px-4 py-2">N</th>
                <th className=" px-4 py-2">Noms</th>
                <th className="px-4 py-2"></th>
                {weekDates.map((date, index) => (
                  <th
                    key={date}
                    className={` p-2 ${
                      index === weekDates.length - 1
                        ? 'border-l-none rounded-tr-md'
                        : ''
                    }`}
                  >
                    {date}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, index) => (
                <tr key={user.id} className="border border-gray-500">
                  <td className="border border-gray-500 px-4 py-3">
                    {indexOfFirstUser + index + 1}
                  </td>
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.surname}</td>
                  {weekDates.map((date) => (
                    <td key={date} className="border border-gray-500 p-2">
                      {/* <button onClick={() => handleFingerprintScan(user.id)}>
                  Mark Attendance
                </button>
                {/* Check if the user attended on the specific date 
                {attendance[user.id]?.includes(date) ? '✅' : '❌'} */}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </Layout>
  );
};

export default AttendanceTable;
