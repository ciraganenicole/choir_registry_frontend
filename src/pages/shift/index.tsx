import React from 'react';
import {
  FaCalendarAlt,
  FaChevronRight,
  FaClock,
  FaMusic,
  FaPlus,
  FaRegCalendarAlt,
  FaUser,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';

const stats = [
  {
    label: 'Current Shift',
    value: 'Sarah Johnson',
    sub: 'Active period',
    icon: <FaUser className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Total Shifts',
    value: 4,
    sub: 'This year',
    icon: <FaCalendarAlt className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Active Leaders',
    value: 5,
    sub: 'Available conductors',
    icon: <FaUsers className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Next Transition',
    value: 68,
    sub: 'Days remaining',
    icon: <FaClock className="ml-2 text-xl text-orange-400" />,
  },
];

const shifts = [
  {
    title: 'Winter 2024',
    status: 'Active',
    leader: 'Sarah Johnson',
    period: '01/01/2024 - 31/03/2024',
    events: 8,
    nextEvent: {
      name: 'Christmas Concert Rehearsal',
      date: '20/01/2024',
      location: 'Main Hall',
    },
    songs: [
      { title: 'Ave Maria', composer: 'Franz Schubert', date: '15/01/2024' },
      { title: 'Amazing Grace', composer: 'Traditional', date: '10/01/2024' },
      { title: 'Silent Night', composer: 'Franz Gruber', date: '05/01/2024' },
    ],
    editable: true,
  },
  {
    title: 'Spring 2024',
    status: 'Upcoming',
    leader: 'Michael Brown',
    period: '01/04/2024 - 30/06/2024',
    events: 6,
    songs: [],
    editable: true,
  },
  {
    title: 'Fall 2023',
    status: 'Completed',
    leader: 'Emily Davis',
    period: '01/09/2023 - 31/12/2023',
    events: 12,
    songs: [
      {
        title: 'Hallelujah Chorus',
        composer: 'George Frideric Handel',
        date: '15/12/2023',
      },
      { title: 'O Holy Night', composer: 'Adolphe Adam', date: '10/12/2023' },
      {
        title: 'Joy to the World',
        composer: 'George Frideric Handel',
        date: '05/12/2023',
      },
      { title: 'The First Noel', composer: 'Traditional', date: '20/11/2023' },
    ],
    editable: true,
  },
];

const leaderHistory = [
  { name: 'Sarah Johnson', periods: 3, events: 24 },
  { name: 'Michael Brown', periods: 2, events: 18 },
  { name: 'Emily Davis', periods: 4, events: 32 },
  { name: 'John Smith', periods: 1, events: 8 },
  { name: 'David Wilson', periods: 2, events: 15 },
];

const statusBadge = (status: string) => {
  if (status === 'Active')
    return (
      <span className="ml-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Active
      </span>
    );
  if (status === 'Upcoming')
    return (
      <span className="ml-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Upcoming
      </span>
    );
  if (status === 'Completed')
    return (
      <span className="ml-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        Completed
      </span>
    );
  return null;
};

const ShiftPage = () => {
  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">
            Shift Management
          </h1>
          <p className="text-base text-gray-500">
            Manage leadership periods and conductor assignments
          </p>
        </div>
        <button className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 md:self-auto">
          <FaPlus /> Create Shift
        </button>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      <div className="flex w-full flex-row gap-4">
        <div className="w-[70%] rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-2 flex items-center">
            <FaCalendarAlt className="mr-2 text-xl text-gray-700" />
            <h2 className="mr-2 text-xl font-bold text-gray-900">
              Leadership Shifts
            </h2>
          </div>
          <p className="mb-4 text-gray-500">
            Current and upcoming leadership periods
          </p>
          <div className="flex flex-col gap-6">
            {shifts.map((shift) => (
              <div
                key={shift.title}
                className="mb-2 rounded-xl border border-gray-300 bg-white p-5"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-row items-center">
                      <span className="mr-2 text-xl font-bold text-gray-900">
                        {shift.title}
                      </span>
                      {statusBadge(shift.status)}
                    </div>
                    <div className="mb-2 flex flex-row items-center justify-between">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          Led by {shift.leader}
                        </div>
                        <div className="flex items-center gap-2">
                          <FaRegCalendarAlt className="text-gray-400" />
                          {shift.period}
                        </div>
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-gray-400" />
                          {shift.events} events scheduled
                        </div>
                      </div>
                      <div className="flex flex-row items-end gap-2">
                        <button className="rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                          Edit
                        </button>
                        <button className="rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                          Details
                        </button>
                      </div>
                    </div>
                    {shift.nextEvent && (
                      <div className="my-2 rounded-md border border-orange-200 bg-orange-50 p-3">
                        <div className="mb-1 text-sm font-semibold text-orange-700">
                          Next Event:
                        </div>
                        <div className="font-medium text-gray-800">
                          {shift.nextEvent.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                          <FaRegCalendarAlt className="text-orange-400" />
                          {shift.nextEvent.date}
                          <FaChevronRight className="text-gray-400" />
                          <span>
                            <FaUsers className="mr-1 inline text-gray-400" />
                            {shift.nextEvent.location}
                          </span>
                        </div>
                      </div>
                    )}
                    {shift.songs && shift.songs.length > 0 && (
                      <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 p-3">
                        <div className="mb-2 flex items-center">
                          <FaMusic className="mr-2 text-blue-400" />
                          <span className="font-semibold text-blue-900">
                            Songs Performed ({shift.songs.length})
                          </span>
                          <button className="ml-auto flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200">
                            <FaPlus className="text-xs" /> Add Song
                          </button>
                        </div>
                        <div className="flex flex-col gap-1">
                          {shift.songs.map((song) => (
                            <div
                              key={song.title}
                              className="flex flex-row items-center justify-between"
                            >
                              <span>
                                <span className="cursor-pointer font-semibold text-blue-700 hover:underline">
                                  {song.title}
                                </span>
                                <span className="ml-2 text-gray-500">
                                  by {song.composer}
                                </span>
                              </span>
                              <span className="text-xs text-gray-500">
                                {song.date}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="w-[30%] rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="mb-2 flex items-center">
            <FaUser className="mr-2 text-xl text-gray-700" />
            <h2 className="mr-2 text-xl font-bold text-gray-900">
              Leadership History
            </h2>
          </div>
          <p className="mb-4 text-gray-500">
            Performance history of choir leaders
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4 font-semibold text-gray-700">
                    Leader
                  </th>
                  <th className="py-2 pr-4 font-semibold text-gray-700">
                    Periods Led
                  </th>
                  <th className="py-2 font-semibold text-gray-700">
                    Total Events
                  </th>
                </tr>
              </thead>
              <tbody>
                {leaderHistory.map((leader) => (
                  <tr key={leader.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {leader.name}
                    </td>
                    <td className="py-2 pr-4">{leader.periods}</td>
                    <td className="py-2">{leader.events}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShiftPage;
