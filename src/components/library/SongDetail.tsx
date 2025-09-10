import React from 'react';
import { FaDownload, FaFilePdf, FaMusic, FaTimes } from 'react-icons/fa';

import type { Song } from '@/lib/library/logic';

interface SongDetailProps {
  song: Song;
  onClose?: () => void;
  onEdit?: () => void;
}

const SongDetail: React.FC<SongDetailProps> = ({ song, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[95vh] w-full overflow-y-auto rounded-lg bg-white shadow-xl md:w-[70%]">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center space-x-3">
            <FaMusic className="text-2xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              Détails du Chant
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
            >
              <FaTimes className="text-md text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Titre
              </label>
              <p className="font-medium text-gray-800">{song.title}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Compositeur
              </label>
              <p className="text-gray-800">{song.composer}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Genre
              </label>
              <p className="text-gray-800">{song.genre}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">
                Difficulté
              </label>
              <span
                className={`inline-block rounded-full px-2 py-1 text-[10px] font-medium ${(() => {
                  if (song.difficulty === 'Easy')
                    return 'bg-green-100 text-green-800';
                  if (song.difficulty === 'Intermediate')
                    return 'bg-yellow-100 text-yellow-800';
                  return 'bg-red-100 text-red-800';
                })()}`}
              >
                {(() => {
                  if (song.difficulty === 'Easy') return 'Facile';
                  if (song.difficulty === 'Intermediate') return 'Moyen';
                  if (song.difficulty === 'Advanced') return 'Difficile';
                  return song.difficulty;
                })()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Statut
              </label>
              <span
                className={`inline-block rounded-full px-2 py-1 text-[10px] font-medium ${(() => {
                  if (song.status === 'Active')
                    return 'bg-green-100 text-green-800';
                  if (song.status === 'In Rehearsal')
                    return 'bg-blue-100 text-blue-800';
                  return 'bg-gray-100 text-gray-800';
                })()}`}
              >
                {(() => {
                  if (song.status === 'Active') return 'Actif';
                  if (song.status === 'In Rehearsal') return 'En Répétition';
                  if (song.status === 'Archived') return 'Archivé';
                  return song.status;
                })()}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Fois Interprété
              </label>
              <p className="text-gray-800">{song.performed}</p>
            </div>
            {song.lastPerformance && (
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Dernière Performance
                </label>
                <p className="text-gray-800">
                  {new Date(song.lastPerformance).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>

          {/* PDF File */}
          {song.pdfFile && (
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-gray-800">
                Fichier PDF
              </h3>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <FaFilePdf className="text-xl text-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">
                      Fichier PDF disponible
                    </p>
                    <p className="text-xs text-gray-600">
                      Paroles extraites du PDF
                    </p>
                  </div>
                  <a
                    href={song.pdfFile}
                    download
                    className="flex items-center gap-1 rounded-md px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800"
                  >
                    <FaDownload />
                    Télécharger
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Lyrics */}
          {song.lyrics && (
            <div>
              <h3 className="mb-2 text-[14px] font-semibold text-gray-800">
                Paroles {song.pdfFile && '(extrait du PDF)'}
              </h3>
              <div className="rounded-lg bg-gray-100 p-4">
                <pre className="whitespace-pre-wrap font-mono text-[16px] text-gray-800">
                  {song.lyrics}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
              {song.added_by && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Ajouté Par
                  </label>
                  <p className="text-gray-800">
                    {(() => {
                      if (
                        typeof song.added_by === 'object' &&
                        song.added_by.firstName &&
                        song.added_by.lastName
                      ) {
                        return `${song.added_by.firstName} ${song.added_by.lastName}`;
                      }
                      if (typeof song.added_by === 'string') {
                        return song.added_by;
                      }
                      return 'Utilisateur Inconnu';
                    })()}
                  </p>
                </div>
              )}
              {song.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Créé Le
                  </label>
                  <p className="text-gray-800">
                    {new Date(song.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              {song.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">
                    Dernière Mise à Jour
                  </label>
                  <p className="text-gray-800">
                    {new Date(song.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongDetail;
