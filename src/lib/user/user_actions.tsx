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
  UserFilters,
} from './type';
import { UserCategory } from './type';

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

    const categoriesWithNewcomer = formData.categories?.includes(
      UserCategory.NEWCOMER,
    )
      ? formData.categories
      : [...formData.categories, UserCategory.NEWCOMER];
    const dataToSubmit = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      gender: formData.gender || '',
      maritalStatus: formData.maritalStatus || '',
      educationLevel: formData.educationLevel || '',
      profession: formData.profession || '',
      competenceDomain: formData.competenceDomain?.trim() || '',
      churchOfOrigin: formData.churchOfOrigin?.trim() || '',
      commune: formData.commune || '',
      quarter: formData.quarter?.trim() || '',
      reference: formData.reference?.trim() || '',
      address: formData.address?.trim() || '',
      phoneNumber: formData.phoneNumber?.trim() || '',
      whatsappNumber: formData.whatsappNumber?.trim() || '',
      email: formData.email?.trim() || '',
      commissions: formData.commissions || [],
      categories: categoriesWithNewcomer,
      profilePicture: formData.profilePicture || null,
      joinDate: null,
      fingerprintData: null,
      voiceCategory: null,
      isActive: false,
    };

    const response = await api.post('/users', dataToSubmit);

    if (response.status === 201) {
      setFormData({ ...defaultFormData } as T);
      onClose();
      onUserCreated();
    } else {
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
  const response = await api.put(`/users/${id}`, updatedData);
  return response.data;
};

export const toggleUserStatus = async (
  userId: number,
  currentStatus: boolean,
) => {
  const response = await api.put(`/users/${userId}/status`, {
    isActive: !currentStatus,
  });
  return response.data;
};

export const DeleteUserAction = async (userId: number) => {
  await api.delete(`/users/${userId}`);
  return true;
};

export const ViewUser = async (userId: number) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const FetchUsers = async (
  filters: UserFilters,
): Promise<{ data: User[]; total: number; page: number; limit: number }> => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      if (key === 'isActive') {
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

  if (Array.isArray(response.data) && response.data.length === 2) {
    const [users, total] = response.data;
    return {
      data: users,
      total,
      page: filters.page || 1,
      limit: filters.limit || 8,
    };
  }

  return response.data;
};

export const RegisterFingerprint = async (userId: number) => {
  const registerResponse = await api.post(
    `/users/${userId}/fingerprint/register`,
  );
  const { challenge } = registerResponse.data;

  const verifyResponse = await api.post(`/users/${userId}/fingerprint/verify`, {
    challenge,
  });
  return verifyResponse.data;
};

export const assignLeadRole = async (
  userId: number,
): Promise<{ user: User; password: string }> => {
  const response = await api.post(`/users/${userId}/assign-lead`);
  return response.data;
};

export const removeLeadRole = async (userId: number): Promise<User> => {
  const response = await api.post(`/users/${userId}/remove-lead`);
  return response.data;
};
