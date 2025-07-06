import React, { useState } from 'react';

import { api } from '@/config/api';

const voicePartOptions = ['Soprano', 'Alto', 'Tenor', 'Bass'];
const difficultyOptions = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Intermediate', label: 'Intermediate' },
  { value: 'Advanced', label: 'Advanced' },
];

export default function SongForm({
  onSuccess,
  onClose,
}: {
  onSuccess?: () => void;
  onClose?: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    composer: '',
    genre: '',
    duration: '',
    difficulty: '',
    status: 'Active',
    voice_parts: [] as string[],
    lyrics: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleVoicePartChange = (part: string) => {
    setForm((prev) => ({
      ...prev,
      voice_parts: prev.voice_parts.includes(part)
        ? prev.voice_parts.filter((p) => p !== part)
        : [...prev.voice_parts, part],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/songs', {
        ...form,
      });
      setForm({
        title: '',
        composer: '',
        genre: '',
        duration: '',
        difficulty: '',
        status: 'Active',
        voice_parts: [],
        lyrics: '',
      });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-bold">Add New Song</h2>
        <p className="mb-4 text-sm text-gray-500">
          Add a new song to your choir&apos;s repertoire. Fill in the details
          below.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2"
            placeholder="Song title"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Composer <span className="text-red-500">*</span>
          </label>
          <input
            name="composer"
            value={form.composer}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2"
            placeholder="Composer name"
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
            className="w-full rounded border border-gray-400 px-3 py-2"
            placeholder="Select genre"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">
            Difficulty <span className="text-red-500">*</span>
          </label>
          <select
            name="difficulty"
            value={form.difficulty}
            onChange={handleChange}
            required
            className="w-full rounded border border-gray-400 px-3 py-2"
          >
            <option value="">Select difficulty</option>
            {difficultyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">Duration</label>
          <input
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full rounded border border-gray-400 px-3 py-2"
            placeholder="e.g., 4:30"
          />
        </div>

        <div>
          <label className="mb-4 block text-sm font-semibold">
            Voice Parts <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-6">
            {voicePartOptions.map((part) => (
              <label
                key={part}
                className="flex items-center gap-2 text-[16px] font-medium"
              >
                <input
                  type="checkbox"
                  checked={form.voice_parts.includes(part)}
                  onChange={() => handleVoicePartChange(part)}
                  className="border-gray-400-gray-300 size-4 rounded border"
                />
                {part}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-semibold">Lyrics</label>
        <textarea
          name="lyrics"
          value={form.lyrics}
          onChange={handleChange}
          className="h-[300px] w-full rounded border border-gray-400 px-3 py-2"
          placeholder="Enter the song lyrics..."
        />
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="mt-4 flex justify-end gap-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-400 px-4 py-2"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
        >
          {loading ? 'Adding...' : 'Add Song'}
        </button>
      </div>
    </form>
  );
}
