import React, { useState } from 'react';
import toast from 'react-hot-toast';

import type { CreateSongDto, Song, UpdateSongDto } from './logic';
import {
  difficultyOptions,
  SongDifficulty,
  SongStatus,
  useCreateSong,
  useUpdateSong,
} from './logic';

export default function SongForm({
  song,
  onSuccess,
  onClose,
}: {
  song?: Song;
  onSuccess?: () => void;
  onClose?: () => void;
}) {
  const {
    createSong,
    isLoading: createLoading,
    error: createError,
  } = useCreateSong();
  const {
    updateSong,
    isLoading: updateLoading,
    error: updateError,
  } = useUpdateSong();

  const isEditing = !!song;
  const isLoading = createLoading || updateLoading;
  const error = createError || updateError;

  const [form, setForm] = useState<CreateSongDto>({
    title: song?.title || '',
    composer: song?.composer || '',
    genre: song?.genre || '',
    difficulty: song?.difficulty || SongDifficulty.INTERMEDIATE,
    status: song?.status || SongStatus.ACTIVE,
    lyrics: song?.lyrics || '',
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && song) {
        const updateData: UpdateSongDto = {
          title: form.title.trim(),
          composer: form.composer.trim(),
          genre: form.genre.trim(),
          difficulty: form.difficulty,
          status: form.status,
          lyrics: form.lyrics?.trim() || '',
        };

        // Ensure all required fields are present
        if (!updateData.title || !updateData.composer || !updateData.genre) {
          return;
        }

        const result = await updateSong(song.id.toString(), updateData);
        if (result) {
          toast.success('Chanson mise à jour avec succès');
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }
      } else {
        const createData = {
          title: form.title.trim(),
          composer: form.composer.trim(),
          genre: form.genre.trim(),
          difficulty: form.difficulty,
          status: form.status,
          lyrics: form.lyrics?.trim() || '',
        };

        // Ensure all required fields are present
        if (!createData.title || !createData.composer || !createData.genre) {
          return;
        }

        const result = await createSong(createData);
        if (result) {
          toast.success('Chanson créée avec succès');
          setForm({
            title: '',
            composer: '',
            genre: '',
            difficulty: SongDifficulty.INTERMEDIATE,
            status: SongStatus.ACTIVE,
            lyrics: '',
          });
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }
      }
    } catch (submitError) {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-3 sm:p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 md:gap-6">
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Titre <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2 text-base"
            placeholder="Titre du chant"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Compositeur <span className="text-red-500">*</span>
          </label>
          <input
            name="composer"
            value={form.composer}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2 text-base"
            placeholder="Nom du compositeur"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Genre <span className="text-red-500">*</span>
          </label>
          <input
            name="genre"
            value={form.genre}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2 text-base"
            placeholder="Genre musical"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold">
            Difficulté <span className="text-red-500">*</span>
          </label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2 text-base"
          >
            {difficultyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Statut <span className="text-red-500">*</span>
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2 text-base"
          >
            <option value={SongStatus.ACTIVE}>Actif</option>
            <option value={SongStatus.IN_REHEARSAL}>En Répétition</option>
            <option value={SongStatus.ARCHIVED}>Archivé</option>
          </select>
        </div>
      </div>

      {/* Lyrics Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold">Paroles</label>
        </div>
        <textarea
          name="lyrics"
          value={form.lyrics}
          onChange={handleChange}
          rows={6}
          className="w-full resize-y rounded border border-gray-400 px-3 py-2 text-base"
          placeholder="Paroles du chant (optionnel)"
        />
      </div>

      <div className="flex flex-col justify-end gap-3 border-t border-gray-200 pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded border border-gray-400 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600 disabled:opacity-50 sm:w-auto"
        >
          {(() => {
            if (isLoading) return 'Enregistrement...';
            if (isEditing) return 'Mettre à Jour';
            return 'Créer';
          })()}
        </button>
      </div>
    </form>
  );
}
