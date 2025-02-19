// userActions.ts

import { startRegistration } from '@simplewebauthn/browser';
import { useState } from 'react';

export const CreateUser = (onClose: () => void, onUserCreated: () => void) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const userData = { name, surname, phoneNumber };

    try {
      const response = await fetch('http://localhost:4000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.status === 201) {
        setName('');
        setSurname('');
        setPhoneNumber('');
        onClose();
        onUserCreated();
      } else {
        console.log('Failed to create user:', data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return {
    name,
    surname,
    phoneNumber,
    setName,
    setSurname,
    setPhoneNumber,
    handleSubmit,
  };
};

export const UpdateUserAction = async (id: number, updatedData: any) => {
  try {
    const response = await fetch(`http://localhost:4000/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error(`Failed to update user with status ${response.status}`);
    }

    const updatedUser = await response.json();
    console.log('User updated successfully:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

export const DeleteUserAction = async (userId: number): Promise<boolean> => {
  try {
    await fetch(`http://localhost:4000/users/${userId}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    return false;
  }
};

export const ViewUser = async (id: number) => {
  try {
    const response = await fetch(`http://localhost:4000/users/${id}`);
    const user = await response.json();
    console.log('User Details:', user);
  } catch (error) {
    console.error('Error viewing user:', error);
  }
};

export const FetchUsers = async (): Promise<any[]> => {
  try {
    const response = await fetch('http://localhost:4000/users');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const RegisterFingerprint = async (userId: number) => {
  try {
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

    const credential = await startRegistration(challengeData);
    console.log('Credential:', credential);

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
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};
