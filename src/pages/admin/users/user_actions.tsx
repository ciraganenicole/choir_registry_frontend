// userActions.ts

import { startRegistration } from '@simplewebauthn/browser';
import { useState } from 'react';

import type { User, UserFilters } from './type';

interface DefaultFormData {
  firstName: string;
  lastName: string;
  gender: string;
  maritalStatus: string;
  educationLevel: string;
  profession: string;
  competenceDomain: string;
  churchOfOrigin: string;
  commune: string;
  quarter: string;
  reference: string;
  address: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  commissions: any[];
  categories: any[];
}

const defaultFormData: DefaultFormData = {
  firstName: '',
  lastName: '',
  gender: '',
  maritalStatus: '',
  educationLevel: '',
  profession: '',
  competenceDomain: '',
  churchOfOrigin: '',
  commune: '',
  quarter: '',
  reference: '',
  address: '',
  phoneNumber: '',
  whatsappNumber: '',
  email: '',
  commissions: [],
  categories: [],
};

export const CreateUser = <T extends DefaultFormData>(
  onClose: () => void,
  onUserCreated: () => void,
) => {
  const [formData, setFormData] = useState<T>({ ...defaultFormData } as T);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:4000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 201) {
        setFormData({ ...defaultFormData } as T);
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
    formData,
    setFormData,
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

export const FetchUsers = async (
  filters: UserFilters,
): Promise<{ data: User[]; total: number; page: number; limit: number }> => {
  try {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(
      `http://localhost:4000/users?${queryParams.toString()}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: [], total: 0, page: 1, limit: 8 };
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
