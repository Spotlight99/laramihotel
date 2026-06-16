'use client';

import { useEffect, useState } from 'react';
import { adminAPI } from '@/lib/admin-api';

interface Booking {
  id: number;
  room: {
    id: number;
    room_number: string;
    room_type: string;
    price_per_night: number;
  };
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number;
  created_at: string;
}

export default function BookingsManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await adminAPI.getBookings();
      setBookings(data.results || data);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error fetching bookings:', err);
      setError(err?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const confirmBooking = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await adminAPI.confirmBooking(bookingId);
      
      // Refresh bookings
      await fetchBookings();
      setError(null);
    } catch (err: any) {
      console.error('❌ Error confirming booking:', err);
      setError(err?.message || 'Failed to confirm booking');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    setActionLoading(bookingId);
    try {
      await adminAPI.cancelBooking(bookingId);
      
      await fetchBookings();
      setError(null);
    } catch (err: any) {
      console.error('❌ Error cancelling booking:', err);
      setError(err?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-green-100 text-green-800',
      'CHECKED_IN': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-forest-900 mb-2">
          Booking Management
        </h1>
        <p className="text-gray-600">
          Manage guest bookings and confirm reservations
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Bookings Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-600">No bookings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-forest-900 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Guest</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Room</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Check-in</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Check-out</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-forest-900">
                          {booking.guest_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.guest_email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-forest-900">
                          {booking.room.room_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.room.room_type}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(booking.check_in).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(booking.check_out).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      {booking.status === 'PENDING' && (
                        <button
                          onClick={() => confirmBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded text-sm transition"
                        >
                          {actionLoading === booking.id ? 'Confirming...' : '✓ Confirm'}
                        </button>
                      )}
                      {['PENDING', 'CONFIRMED'].includes(booking.status) && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded text-sm transition"
                        >
                          {actionLoading === booking.id ? 'Cancelling...' : '✕ Cancel'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How it works:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>PENDING:</strong> New booking waiting for confirmation</li>
          <li>• <strong>CONFIRMED:</strong> Booking confirmed, room marked as reserved</li>
          <li>• <strong>CHECKED_IN:</strong> Guest has checked in</li>
          <li>• <strong>COMPLETED:</strong> Guest has checked out</li>
          <li>• Click <strong>Confirm</strong> to accept a booking and reserve the room</li>
        </ul>
      </div>
    </div>
  );
}
