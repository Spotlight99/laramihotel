'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/admin-api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_bookings: 0,
    confirmed_bookings: 0,
    checked_in: 0,
    pending: 0,
    occupancy_rate: '0%',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminAPI.getBookingStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching stats:', err);
      setError(err?.message || 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-forest-900 mb-2">
          Manager Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back! Here's an overview of your hotel.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Bookings */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-gold-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Total Bookings
                </p>
                <h3 className="text-3xl font-bold text-forest-900">
                  {stats.total_bookings}
                </h3>
              </div>
              <div className="text-4xl opacity-20">📅</div>
            </div>
          </div>

          {/* Confirmed Bookings */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Confirmed
                </p>
                <h3 className="text-3xl font-bold text-green-600">
                  {stats.confirmed_bookings}
                </h3>
              </div>
              <div className="text-4xl opacity-20">✓</div>
            </div>
          </div>

          {/* Checked In */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Checked In
                </p>
                <h3 className="text-3xl font-bold text-blue-600">
                  {stats.checked_in}
                </h3>
              </div>
              <div className="text-4xl opacity-20">🔑</div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Pending
                </p>
                <h3 className="text-3xl font-bold text-yellow-600">
                  {stats.pending}
                </h3>
              </div>
              <div className="text-4xl opacity-20">⏳</div>
            </div>
          </div>
        </div>
      )}

      {/* Occupancy Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-forest-900 mb-4">
          Occupancy Rate
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-gold-500 to-forest-700 h-full"
                style={{
                  width: stats.occupancy_rate.replace('%', '') + '%',
                }}
              />
            </div>
          </div>
          <div className="text-2xl font-bold text-forest-900">
            {stats.occupancy_rate}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {stats.confirmed_bookings + stats.checked_in} out of total bookings are active
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-forest-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/rooms"
            className="p-4 bg-gradient-to-br from-gold-100 to-gold-50 rounded-lg hover:shadow-md transition cursor-pointer border border-gold-200"
          >
            <h3 className="font-bold text-forest-900 mb-2">🛏️ Manage Rooms</h3>
            <p className="text-sm text-gray-600">
              Create, edit, or delete room listings
            </p>
          </a>

          <a
            href="/admin/bookings"
            className="p-4 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg hover:shadow-md transition cursor-pointer border border-blue-200"
          >
            <h3 className="font-bold text-forest-900 mb-2">📅 View Bookings</h3>
            <p className="text-sm text-gray-600">
              Confirm and manage guest bookings
            </p>
          </a>

          <a
            href="/admin/hotel"
            className="p-4 bg-gradient-to-br from-green-100 to-green-50 rounded-lg hover:shadow-md transition cursor-pointer border border-green-200"
          >
            <h3 className="font-bold text-forest-900 mb-2">🏨 Hotel Info</h3>
            <p className="text-sm text-gray-600">
              Update hotel details and contact info
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
