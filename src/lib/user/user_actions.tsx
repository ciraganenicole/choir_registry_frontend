// userActions.ts

import { startRegistration } from '@simplewebauthn/browser';
import { useState } from 'react';

import { API_URL } from '@/config/api';

import type {
  Commission,
  Commune,
  EducationLevel,
  Gender,
  MaritalStatus,
  Profession,
  User,
  UserCategory,
  UserFilters,
} from './type';

interface DefaultFormData {
  firstName: string;
  lastName: string;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  educationLevel: EducationLevel | null;
  profession: Profession | null;
  competenceDomain: string | null;
  churchOfOrigin: string | null;
  commune: Commune | null;
  quarter: string | null;
  reference: string | null;
  address: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  email: string | null;
  commissions: Commission[];
  categories: UserCategory[];
  profilePicture?: string | null;
}

const defaultFormData: DefaultFormData = {
  firstName: '',
  lastName: '',
  gender: null,
  maritalStatus: null,
  educationLevel: null,
  profession: null,
  competenceDomain: null,
  churchOfOrigin: null,
  commune: null,
  quarter: null,
  reference: null,
  address: null,
  phoneNumber: null,
  whatsappNumber: null,
  email: null,
  commissions: [],
  categories: [],
  profilePicture: null,
};

export const CreateUser = <T extends DefaultFormData>(
  onClose: () => void,
  onUserCreated: () => void,
) => {
  const [formData, setFormData] = useState<T>({ ...defaultFormData } as T);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare the data for submission
      const dataToSubmit = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        // For enum fields, send empty string if null
        gender: formData.gender || '',
        maritalStatus: formData.maritalStatus || '',
        educationLevel: formData.educationLevel || '',
        profession: formData.profession || '',
        // For string fields, send empty string if null
        competenceDomain: formData.competenceDomain?.trim() || '',
        churchOfOrigin: formData.churchOfOrigin?.trim() || '',
        commune: formData.commune || '',
        quarter: formData.quarter?.trim() || '',
        reference: formData.reference?.trim() || '',
        address: formData.address?.trim() || '',
        phoneNumber: formData.phoneNumber?.trim() || '',
        whatsappNumber: formData.whatsappNumber?.trim() || '',
        email: formData.email?.trim() || '',
        // For arrays, keep as empty arrays
        commissions: formData.commissions || [],
        categories: formData.categories || [],
        // For optional fields that can be null
        profilePicture: formData.profilePicture || null,
        joinDate: null,
        fingerprintData: null,
        voiceCategory: null,
        isActive: true,
      };

      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await response.json();

      if (response.status === 201) {
        setFormData({ ...defaultFormData } as T);
        onClose();
        onUserCreated();
      } else {
        console.error('Failed to create user:', data);
        throw new Error(
          Array.isArray(data.errors)
            ? data.errors
                .map(
                  (err: any) =>
                    `${err.field}: ${Object.values(err.constraints || {}).join(', ')}`,
                )
                .join('\n')
            : data.message || 'Failed to create user',
        );
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };

  return {
    formData,
    setFormData,
    handleSubmit,
  };
};

export const UpdateUserAction = async (
  id: number,
  updatedData: Partial<User>,
) => {
  try {
    console.log('Sending update with payload:', updatedData);
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(updatedData),
    });

    const data = await response.json();
    console.log('Update response:', data);

    if (!response.ok) {
      throw new Error(
        data.message || `Failed to update user with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const toggleUserStatus = async (
  userId: number,
  currentStatus: boolean,
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ isActive: !currentStatus }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(
        data.message ||
          `Failed to toggle user status with status ${response.status}`,
      );
    }

    return !currentStatus; // Return the new status
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

export const DeleteUserAction = async (userId: number): Promise<boolean> => {
  try {
    await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.error('Failed to delete user:', error);
    return false;
  }
};

export const ViewUser = async (id: number) => {
  try {
    const response = await fetch(`${API_URL}/users/${id}`);
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

    // Handle each filter parameter explicitly
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        // Special handling for isActive to ensure it's a proper boolean
        if (key === 'isActive') {
          // Only append if it's explicitly true or false
          if (value === true) {
            queryParams.append('isActive', 'true');
          } else if (value === false) {
            queryParams.append('isActive', 'false');
          }
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const url = `${API_URL}/users?${queryParams.toString()}`;
    console.log('Fetching users with query:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const RegisterFingerprint = async (userId: number) => {
  try {
    const resp = await fetch(`${API_URL}/webauthn/register-challenge`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
      headers: { 'Content-Type': 'application/json' },
    });

    const challengeData = await resp.json();
    console.log('Challenge:', challengeData);

    const credential = await startRegistration(challengeData);
    console.log('Credential:', credential);

    const verificationResp = await fetch(
      `${API_URL}/webauthn/verify-registration`,
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
