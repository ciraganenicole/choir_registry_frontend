import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaPaperclip,
  FaUser,
} from 'react-icons/fa';

import { CommuniqueService } from '@/lib/communique/service';
import type { Communique } from '@/types/communique.types';

interface CommuniqueWidgetProps {
  limit?: number;
  className?: string;
}

const CommuniqueWidget: React.FC<CommuniqueWidgetProps> = ({
  limit = 3,
  className = '',
}) => {
  const [latestCommuniques, setLatestCommuniques] = useState<Communique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLatestCommuniques = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommuniqueService.getLatestCommuniques(limit);
      setLatestCommuniques(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch latest announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestCommuniques();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (url: string) => {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dernières Annonces
        </h2>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-gray-500">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dernières Annonces
        </h2>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-red-500">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  if (latestCommuniques.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Dernières Annonces
        </h2>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-gray-500">Aucune annonce disponible</div>
        </div>
        <div className="mt-4">
          <Link
            href="/announcements"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Voir toutes les annonces →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Dernières Annonces
        </h2>
        <Link
          href="/announcements"
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          Voir tout
          <FaArrowRight className="ml-1" />
        </Link>
      </div>

      <div className="space-y-4">
        {latestCommuniques.map((communique) => (
          <div
            key={communique.id}
            className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
          >
            <div className="mb-2 flex items-start justify-between">
              <h3 className="line-clamp-2 flex-1 text-sm font-medium text-gray-900">
                {communique.title}
              </h3>
              <div className="ml-2 flex items-center text-xs text-gray-500">
                <FaCalendarAlt className="mr-1" />
                {formatDate(communique.createdAt)}
              </div>
            </div>

            <p className="mb-2 line-clamp-2 text-xs text-gray-600">
              {communique.content}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <FaUser className="mr-1" />
                {communique.createdBy
                  ? `${communique.createdBy.firstName} ${communique.createdBy.lastName}`
                  : 'Admin'}
              </div>

              {communique.attachmentUrl && (
                <div className="flex items-center text-xs text-blue-600">
                  <FaPaperclip className="mr-1" />
                  <span className="mr-1">
                    {getFileIcon(communique.attachmentUrl)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <Link
          href="/announcements"
          className="flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          Voir toutes les annonces
          <FaArrowRight className="ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default CommuniqueWidget;
