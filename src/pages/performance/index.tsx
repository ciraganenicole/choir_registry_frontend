import React from 'react';
import {
  FaCalendarAlt,
  FaEdit,
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaStar,
  FaTrophy,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';

import { Card, CardContent } from '@/components/card';
import Layout from '@/components/layout';

const performanceStats = [
  {
    label: 'Total Performances',
    value: 24,
    sub: '+6 this year',
    icon: <FaTrophy className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Average Attendance',
    value: '89%',
    sub: 'Member participation',
    icon: <FaUsers className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Average Rating',
    value: '4.7',
    sub: 'Audience feedback',
    icon: <FaStar className="ml-2 text-xl text-orange-400" />,
  },
  {
    label: 'Upcoming Events',
    value: 3,
    sub: 'Next 3 months',
    icon: <FaCalendarAlt className="ml-2 text-xl text-orange-400" />,
  },
];

const performances = [
  {
    title: 'Christmas Concert 2024',
    status: 'Upcoming',
    type: 'Concert',
    date: 'Friday, December 20, 2024',
    location: 'City Concert Hall',
    audience: 500,
    attendance: null,
    rating: null,
    editable: true,
  },
  {
    title: 'Community Festival',
    status: 'Completed',
    type: 'Festival',
    date: 'Friday, January 12, 2024',
    location: 'Central Park Amphitheater',
    audience: 300,
    attendance: '82/84',
    rating: 4.8,
    editable: false,
  },
  {
    title: 'Thanksgiving Service',
    status: 'Completed',
    type: 'Religious',
    date: 'Thursday, November 23, 2023',
    location: "St. Mary's Cathedral",
    audience: 200,
    attendance: '75/84',
    rating: 4.9,
    editable: false,
  },
  {
    title: 'Spring Showcase',
    status: 'Planned',
    type: 'Showcase',
    date: 'Friday, March 15, 2024',
    location: 'University Auditorium',
    audience: 400,
    attendance: null,
    rating: null,
    editable: true,
  },
];

const statusBadge = (status: string) => {
  if (status === 'Upcoming')
    return (
      <span className="mr-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
        Upcoming
      </span>
    );
  if (status === 'Completed')
    return (
      <span className="mr-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Completed
      </span>
    );
  if (status === 'Planned')
    return (
      <span className="mr-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        Planned
      </span>
    );
  return null;
};

const typeBadge = (type: string) => (
  <span className="mr-2 rounded-full border bg-white px-3 py-1 text-xs font-semibold text-gray-900">
    {type}
  </span>
);

const PerformancePage = () => {
  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-1 text-3xl font-bold text-gray-900">Performance</h1>
          <p className="text-base text-gray-500">
            Track concerts, events, and performance history
          </p>
        </div>
        <button className="flex items-center gap-2 self-start rounded-md bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 md:self-auto">
          + Add Performance
        </button>
      </div>
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceStats.map((stat) => (
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
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center">
          <FaTrophy className="mr-2 text-xl text-gray-700" />
          <h2 className="mr-2 text-xl font-bold text-gray-900">
            Performance History & Schedule
          </h2>
        </div>
        <p className="mb-4 text-gray-500">
          Track all choir performances, concerts, and special events
        </p>
        <div className="flex flex-col gap-3">
          {performances.map((perf) => (
            <div
              key={perf.title}
              className="flex flex-col gap-4 rounded-lg border border-gray-300 p-4 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-row items-center">
                  <span className="mr-2 text-xl font-bold text-gray-900">
                    {perf.title}
                  </span>
                  {statusBadge(perf.status)}
                  {typeBadge(perf.type)}
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaRegCalendarAlt className="text-gray-400" />
                    {perf.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    {perf.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaUserFriends className="text-gray-400" />
                    Expected audience: {perf.audience}
                  </div>
                </div>
              </div>
              <div className="flex min-w-[120px] flex-col items-end gap-2">
                {perf.attendance && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      Member Attendance
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {perf.attendance}
                    </div>
                  </div>
                )}
                {/* {perf.rating && (
                  <div className="flex items-center gap-1 text-right">
                    <FaStar className="text-yellow-400" />
                    <span className="font-semibold text-lg text-gray-700">{perf.rating}</span>
                  </div>
                )} */}
                {perf.editable ? (
                  <button className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                    <FaEdit className="text-gray-400" /> Edit
                  </button>
                ) : (
                  perf.rating && (
                    <button className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-1 font-medium text-gray-700 hover:bg-gray-100">
                      View Details
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default PerformancePage;
