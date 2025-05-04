// userActions.ts
import { useState } from 'react';

import { api } from '@/config/api';

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

      const response = await api.post('/users', dataToSubmit);

      if (response.status === 201) {
        setFormData({ ...defaultFormData } as T);
        onClose();
        onUserCreated();
      } else {
        console.error('Failed to create user:', response.data);
        throw new Error(
          Array.isArray(response.data.errors)
            ? response.data.errors
                .map(
                  (err: any) =>
                    `${err.field}: ${Object.values(err.constraints || {}).join(', ')}`,
                )
                .join('\n')
            : response.data.message || 'Failed to create user',
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
    const response = await api.put(`/users/${id}`, updatedData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const toggleUserStatus = async (
  userId: number,
  currentStatus: boolean,
) => {
  try {
    const response = await api.put(`/users/${userId}/status`, {
      isActive: !currentStatus,
    });
    return response.data;
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

export const DeleteUserAction = async (userId: number) => {
  try {
    await api.delete(`/users/${userId}`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const ViewUser = async (userId: number) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
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

    const response = await api.get(`/users?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const RegisterFingerprint = async (userId: number) => {
  try {
    // Step 1: Register challenge
    const registerResponse = await api.post(
      `/users/${userId}/fingerprint/register`,
    );
    const { challenge } = registerResponse.data;

    // Step 2: Verify registration
    const verifyResponse = await api.post(
      `/users/${userId}/fingerprint/verify`,
      {
        challenge,
      },
    );
    return verifyResponse.data;
  } catch (error) {
    console.error('Error registering fingerprint:', error);
    throw error;
  }
};
