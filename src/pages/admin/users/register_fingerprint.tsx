'use client';

import { startRegistration } from '@simplewebauthn/browser';
import { useState } from 'react';

export default function RegisterFingerprint({ userId }: { userId: number }) {
  const [message, setMessage] = useState('');

  const registerFingerprint = async () => {
    try {
      // Step 1: Get registration challenge from the backend
      const resp = await fetch(
        'http://localhost:4000/webauthn/register-challenge',
        {
          method: 'POST',
          body: JSON.stringify({ userId }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const challengeData = await resp.json();
      console.log('Challenge:', challengeData);

      // Step 2: Start fingerprint registration
      const credential = await startRegistration(challengeData);
      console.log('Credential:', credential);

      // Step 3: Send the credential back to the backend for verification
      const verificationResp = await fetch(
        'http://localhost:4000/webauthn/verify-registration',
        {
          method: 'POST',
          body: JSON.stringify({ userId, credential }),
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const verificationData = await verificationResp.json();

      if (verificationData.success) {
        setMessage('Fingerprint registered successfully!');
      } else {
        setMessage('Fingerprint registration failed.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred while registering your fingerprint.');
    }
  };

  return (
    <div>
      <button
        onClick={registerFingerprint}
        className="mt-4 w-full rounded-md bg-gray-500 px-4 py-2 font-semibold text-white hover:bg-gray-600"
      >
        Register Fingerprint
      </button>
      <p>{message}</p>
    </div>
  );
}
