import { useAttendance } from './logic'; // Importing useAttendance hook

const AttendanceTable = () => {
  const { users, attendance, markAttendance, loading } = useAttendance(); // Removed setAttendance here

  const getWeekDates = (): string[] => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Adjust to Monday

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.toISOString().split('T')[0] || ''; // Format: YYYY-MM-DD
    });
  };
  const weekDates = getWeekDates(); // Function to get the current week's dates

  const getCredential = async (): Promise<Credential | null> => {
    // Set up the WebAuthn request options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
      {
        challenge: new Uint8Array([
          /* The challenge from the server */
        ]),
        allowCredentials: [
          {
            id: new Uint8Array([
              /* The credential ID, typically stored during registration */
            ]),
            type: 'public-key' as 'public-key',
          },
        ],
        timeout: 60000,
        userVerification: 'preferred',
      };

    try {
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      // Check if credential is null
      if (credential === null) {
        console.error('No credential returned.');
        return null; // Returning null when credential is not obtained
      }

      return credential;
    } catch (error) {
      console.error('Error getting WebAuthn credential:', error);
      return null; // Return null in case of error
    }
  };

  const handleFingerprintScan = async () => {
    try {
      const credential = await getCredential();

      if (!credential) {
        console.error('No credential returned or error occurred.');
        return;
      }

      // Proceed with the credential if it's valid
      const userId = 3; // Your logic to get the userId
      markAttendance(userId, credential);
    } catch (error) {
      console.error('Error during WebAuthn authentication:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <table className="w-full border border-gray-300">
      <thead>
        <tr className="bg-gray-200">
          <th className="border p-2">Name</th>
          {weekDates.map((date) => (
            <th key={date} className="border p-2">
              {date}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border">
            <td className="border p-2">{user.name}</td>
            {weekDates.map((date) => (
              <td key={date} className="border p-2 text-center">
                <button onClick={() => handleFingerprintScan()}>
                  Mark Attendance
                </button>
                {/* Check if the user attended on the specific date */}
                {attendance[user.id]?.includes(date) ? '✅' : '❌'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AttendanceTable;
