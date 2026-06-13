'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { bookingsAPI, roomsAPI } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const roomId = searchParams.get('room_id');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: user?.email || '',
    guest_phone: '',
    number_of_guests: 1,
    special_requests: '',
  });
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  const fetchRoom = async () => {
  try {
    const rooms = await roomsAPI.getAll();

    console.log("ROOMS:", rooms);
    console.log("IS ARRAY:", Array.isArray(rooms));

  } catch (error) {
    console.error("Failed to fetch room:", error);
  }
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await bookingsAPI.create({
        ...formData,
        room_id: parseInt(roomId!),
        check_in: checkIn!,
        check_out: checkOut!,
      });

      setBookingResult(result);
    } catch (error: any) {
      alert(`Booking failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (bookingResult) {
    return (
      <div className="py-28 bg-cream">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-gold-400">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="font-display text-forest-900 text-3xl font-semibold mb-3">Booking Confirmed!</h1>
            <p className="text-forest-600 mb-6">Your booking has been received. Please complete payment on WhatsApp.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border border-forest-100 mb-6">
            <h2 className="font-display text-forest-900 text-lg font-semibold mb-4">Booking Details</h2>
            <div className="space-y-3 text-forest-700">
              <p><strong>Booking ID:</strong> {bookingResult.booking.id}</p>
              <p><strong>Guest Name:</strong> {bookingResult.booking.guest_name}</p>
              <p><strong>Room:</strong> {bookingResult.booking.room.room_number}</p>
              <p><strong>Check-in:</strong> {bookingResult.booking.check_in}</p>
              <p><strong>Check-out:</strong> {bookingResult.booking.check_out}</p>
              <p><strong>Total Price:</strong> ₦{bookingResult.booking.total_price.toLocaleString()}</p>
              <p><strong>Invoice:</strong> {bookingResult.invoice.invoice_number}</p>
            </div>
          </div>

          <a
            href={bookingResult.payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold text-forest-900 font-bold py-3 rounded-lg block text-center w-full mb-4"
          >
            💬 Complete Payment on WhatsApp
          </a>

          <p className="text-center text-forest-600 text-sm">
            Click the button above to open WhatsApp and confirm your booking with the manager. After payment confirmation, your booking will be activated.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-28 bg-cream">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="font-display text-forest-900 text-3xl font-semibold mb-8">Complete Your Booking</h1>

        {room && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-forest-100">
            {/* Room Info */}
            <div className="mb-8 p-6 bg-gold-50 rounded-xl">
              <h2 className="font-display text-forest-900 text-lg font-semibold mb-3">Room Selected</h2>
              <p className="text-forest-700"><strong>Room:</strong> {room.room_number} - {room.room_type}</p>
              <p className="text-forest-700"><strong>Price:</strong> ₦{room.price_per_night.toLocaleString()}/night</p>
              <p className="text-forest-700"><strong>Check-in:</strong> {checkIn}</p>
              <p className="text-forest-700"><strong>Check-out:</strong> {checkOut}</p>
            </div>

            {/* Guest Info */}
            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.guest_email}
                  onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.guest_phone}
                  onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Number of Guests *</label>
                <select
                  required
                  value={formData.number_of_guests}
                  onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Special Requests</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  placeholder="E.g., Late check-in, extra bed, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="mb-6 p-4 bg-forest-50 rounded-lg">
              <p className="text-forest-600 text-sm">
                By booking, you agree to our cancellation policy: Free cancellation up to 24 hours before check-in.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold text-forest-900 font-bold py-3 rounded-lg w-full disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Proceed to Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
