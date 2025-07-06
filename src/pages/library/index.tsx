import React, { useState } from 'react';
import {
  FaClock,
  FaMusic,
  FaPlus,
  FaRegCalendarAlt,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';
import SongForm from '@/lib/library/form';

const stats = [
  {
    label: 'Total Songs',
    value: 4,
    sub: '+3 this month',
    icon: <FaMusic className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Active Repertoire',
    value: 2,
    sub: 'Ready to perform',
    icon: <FaUsers className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'In Rehearsal',
    value: 1,
    sub: 'Currently learning',
    icon: <FaClock className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'New Additions',
    value: 3,
    sub: 'This month',
    icon: <FaMusic className="ml-2 text-xl text-orange-400" />,
  },
];

const songs = [
  {
    title: 'Ave Maria',
    status: ['Active'],
    difficulty: ['Advanced'],
    composer: 'Franz Schubert',
    genre: 'Classical',
    duration: '4:30',
    voiceParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    performed: 15,
    lastPerformance: '12/01/2024',
  },
  {
    title: 'Amazing Grace',
    status: ['Active'],
    difficulty: ['Intermediate'],
    composer: 'Traditional',
    genre: 'Spiritual',
    duration: '3:45',
    voiceParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    performed: 28,
    lastPerformance: '23/11/2023',
  },
  {
    title: 'Hallelujah Chorus',
    status: ['In Rehearsal'],
    difficulty: ['Advanced'],
    composer: 'George Frideric Handel',
    genre: 'Baroque',
    duration: '6:15',
    voiceParts: ['Soprano', 'Alto', 'Tenor', 'Bass'],
    performed: 0,
    lastPerformance: null,
  },
  {
    title: 'Bridge Over Troubled Water',
    status: ['Archived'],
    difficulty: ['Intermediate'],
    composer: 'Paul Simon',
    genre: 'Contemporary',
    duration: '4:55',
    voiceParts: ['Soprano', 'Alto', 'Tenor'],
    performed: 8,
    lastPerformance: '15/06/2023',
  },
];

const statusBadge = (status: string) => {
  if (status === 'Active')
    return (
      <span className="mr-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Active
      </span>
    );
  if (status === 'In Rehearsal')
    return (
      <span className="mr-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        In Rehearsal
      </span>
    );
  if (status === 'Archived')
    return (
      <span className="mr-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        Archived
      </span>
    );
  return null;
};

const difficultyBadge = (difficulty: string) => {
  if (difficulty === 'Advanced')
    return (
      <span className="mr-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
        Advanced
      </span>
    );
  if (difficulty === 'Intermediate')
    return (
      <span className="mr-2 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        Intermediate
      </span>
    );
  return null;
};

const voicePartBadge = (part: string) => (
  <span
    key={part}
    className="mb-1 mr-1 inline-block rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-gray-900"
  >
    {part}
  </span>
);

const LibraryPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">Repertoire</h1>
          <p className="text-base text-gray-500">
            Manage your choir&apos;s music library and arrangements
          </p>
        </div>
        <button
          className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 md:self-auto"
          onClick={() => setShowForm(true)}
        >
          <FaPlus /> Add Song
        </button>
      </div>
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative rounded-lg bg-white p-4 shadow-lg sm:w-[95%] md:w-[80%] md:p-8">
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-8 top-2 text-3xl font-bold text-red-500 hover:text-red-700"
            >
              &times;
            </button>
            <SongForm
              onSuccess={() => setShowForm(false)}
              onClose={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-l-4 border-orange-400">
            <CardContent>
              <div className="flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center text-sm font-medium text-gray-500">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">{stat.sub}</div>
                </div>
                <div>{stat.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mb-4 rounded-lg border border-gray-300 bg-white p-1 md:p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search songs, composers, or genres..."
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-gray-700 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>
          <div className="mt-2 flex flex-row gap-2 md:mt-0">
            <button className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              Genre
            </button>
            <button className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              Difficulty
            </button>
            <button className="rounded-md border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-100">
              Status
            </button>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-2 flex items-center">
          <FaMusic className="mr-2 text-xl text-gray-700" />
          <h2 className="mr-2 text-xl font-bold text-gray-900">Song Library</h2>
        </div>
        <p className="mb-4 text-gray-500">
          Complete collection of your choir&apos;s repertoire
        </p>
        <div className="flex flex-col gap-4">
          {songs.map((song) => (
            <div
              key={song.title}
              className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-row items-center">
                  <span className="mr-2 text-xl font-bold text-gray-900">
                    {song.title}
                  </span>
                  {song.status.map(statusBadge)}
                  {song.difficulty.map(difficultyBadge)}
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div>
                    <div className="font-medium text-gray-700">Composer</div>
                    <div>{song.composer}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Genre</div>
                    <div>{song.genre}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Duration</div>
                    <div className="flex items-center gap-1">
                      <FaRegCalendarAlt className="text-gray-400" />
                      {song.duration}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Voice Parts</div>
                    <div>{song.voiceParts.length} parts</div>
                  </div>
                </div>
                <div className="mb-2 flex flex-wrap gap-1">
                  {song.voiceParts.map(voicePartBadge)}
                </div>
              </div>
              <div className="flex min-w-[120px] flex-col items-end gap-2">
                <div className="text-right">
                  <div className="text-xs text-gray-500">Performed</div>
                  <div className="text-lg font-bold text-orange-500">
                    {song.performed}x
                  </div>
                  {song.lastPerformance && (
                    <div className="mt-1 text-xs text-gray-500">
                      Last Performance
                      <br />
                      <span className="font-medium text-gray-700">
                        {song.lastPerformance}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-row gap-2">
                  <button className="rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                    Edit
                  </button>
                  <button className="rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                    Sheet Music
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default LibraryPage;
