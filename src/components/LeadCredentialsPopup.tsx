import React from 'react';
import { FaCheck, FaCopy, FaTimes } from 'react-icons/fa';

interface LeadCredentialsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  } | null;
}

const LeadCredentialsPopup: React.FC<LeadCredentialsPopupProps> = ({
  isOpen,
  onClose,
  userData,
}) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen || !userData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <FaTimes className="size-5" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="size-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Rôle LEAD attribué avec succès !
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Les identifiants utilisateur ont été générés. Veuillez les conserver
            précieusement.
          </p>
        </div>

        {/* User Information */}
        <div className="space-y-4">
          {/* Full Name */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Nom complet
              </label>
              <button
                onClick={() =>
                  copyToClipboard(
                    `${userData.firstName} ${userData.lastName}`,
                    'name',
                  )
                }
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                {copiedField === 'name' ? (
                  <>
                    <FaCheck className="size-3" />
                    Copié !
                  </>
                ) : (
                  <>
                    <FaCopy className="size-3" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {userData.firstName} {userData.lastName}
            </div>
          </div>

          {/* Email */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <button
                onClick={() => copyToClipboard(userData.email, 'email')}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                {copiedField === 'email' ? (
                  <>
                    <FaCheck className="size-3" />
                    Copié !
                  </>
                ) : (
                  <>
                    <FaCopy className="size-3" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {userData.email}
            </div>
          </div>

          {/* Password */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <button
                onClick={() => copyToClipboard(userData.password, 'password')}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                {copiedField === 'password' ? (
                  <>
                    <FaCheck className="size-3" />
                    Copié !
                  </>
                ) : (
                  <>
                    <FaCopy className="size-3" />
                    Copier
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-lg font-semibold text-gray-900">
              {userData.password}
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 rounded-lg bg-yellow-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg
                className="size-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Avis de sécurité important
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Veuillez fournir ces informations d&apos;identification à
                  l&apos;utilisateur en toute sécurité. Le mot de passe et
                  l&apos;adresse e-mail seront utilisés pour accéder au système.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCredentialsPopup;
