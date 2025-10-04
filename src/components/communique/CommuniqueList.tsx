import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { FaCalendarAlt, FaEye, FaPaperclip, FaUser } from 'react-icons/fa';

import { CommuniqueService } from '@/lib/communique/service';
import type { Communique } from '@/types/communique.types';

interface CommuniqueListProps {
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const CommuniqueList: React.FC<CommuniqueListProps> = ({
  limit,
  showHeader = true,
  className = '',
}) => {
  const [communiques, setCommuniques] = useState<Communique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommuniques = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CommuniqueService.getAllCommuniques();
      const limitedData = limit ? data.slice(0, limit) : data;
      setCommuniques(limitedData);
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommuniques();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <div className={`${className}`}>
        {showHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Annonces</h2>
            <p className="text-gray-600">
              Dernières communications de la chorale
            </p>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Chargement des annonces...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Annonces</h2>
            <p className="text-gray-600">
              Dernières communications de la chorale
            </p>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">Erreur: {error}</div>
        </div>
      </div>
    );
  }

  if (communiques.length === 0) {
    return (
      <div className={`${className}`}>
        {showHeader && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Annonces</h2>
            <p className="text-gray-600">
              Dernières communications de la chorale
            </p>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Aucune annonce disponible</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showHeader && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Annonces</h2>
          <p className="text-gray-600">
            Dernières communications de la chorale
          </p>
        </div>
      )}

      <div className="space-y-4">
        {communiques.map((communique) => (
          <div
            key={communique.id}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <Link
                href={`/announcements/${communique.id}`}
                className="line-clamp-2 flex-1 text-lg font-semibold text-gray-900 transition-colors hover:text-blue-600"
              >
                {communique.title}
              </Link>
              <div className="ml-4 flex items-center text-sm text-gray-500">
                <FaCalendarAlt className="mr-1" />
                {formatDate(communique.createdAt)}
              </div>
            </div>

            <div className="mb-4 whitespace-pre-wrap text-gray-700">
              {communique.content}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <FaUser className="mr-1" />
                {communique.createdBy
                  ? `${communique.createdBy.firstName} ${communique.createdBy.lastName}`
                  : 'Administrateur'}
              </div>

              <div className="flex items-center space-x-3">
                {communique.attachmentUrl && (
                  <a
                    href={communique.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 transition-colors hover:text-blue-800"
                  >
                    <FaPaperclip className="mr-1" />
                    <span className="mr-1">
                      {getFileIcon(communique.attachmentUrl)}
                    </span>
                    Pièce jointe
                  </a>
                )}

                <Link
                  href={`/announcements/${communique.id}`}
                  className="flex items-center text-sm text-gray-600 transition-colors hover:text-blue-600"
                  title="Voir l'annonce"
                >
                  <FaEye className="mr-1" />
                  Voir
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommuniqueList;
