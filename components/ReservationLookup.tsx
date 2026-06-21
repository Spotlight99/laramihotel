'use client';

import { useState } from 'react';
import { bookingsAPI } from '@/lib/api';
import { generateReceiptPDF, downloadReceiptAsText, ReceiptData } from '@/lib/receiptGenerator';
import { useHotelInfo } from '@/lib/useHotelInfo';

interface Booking {
  id: number;
  booking_id?: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room: {
    id: number;
    room_number: string;
    room_type: string;
    price_per_night: number;
  };
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  total_price: number;
  number_of_nights: number;
  created_at: string;
}

export default function ReservationLookup() {
  const [searchType, setSearchType] = useState<'booking_id' | 'email' | 'phone'>('email');
  const [searchValue, setSearchValue] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const { hotel } = useHotelInfo();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setError(null);

    try {
      let results: Booking[] = [];

      if (searchType === 'email') {
        results = await bookingsAPI.search(searchValue);
      } else if (searchType === 'phone') {
        results = await bookingsAPI.search('', searchValue);
      } else if (searchType === 'booking_id') {
        // For booking ID, try to fetch directly
        try {
          const booking = await bookingsAPI.getById(parseInt(searchValue), '');
          results = [booking];
        } catch (err) {
          setError('Booking not found. Please check the booking ID.');
          results = [];
        }
      }

      setBookings(results);
      if (results.length === 0 && !error) {
        setError('No bookings found for the provided information.');
      }
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Failed to search bookings. Please try again.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async (bookingId: number) => {
    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const result = await bookingsAPI.getPaymentLink(bookingId);
      if (result.payment_link) {
        window.open(result.payment_link, '_blank');
      } else {
        alert('Could not generate payment link. Please try again.');
      }
    } catch (error: any) {
      alert(`Failed to generate payment link: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (
      !confirm(
        'Are you sure you want to cancel this reservation? This action cannot be undone. You may be eligible for a refund according to our cancellation policy.'
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
    try {
      await bookingsAPI.cancel(bookingId);
      alert('Booking cancelled successfully. The booking details have been updated.');
      // Refresh the search to show updated status
      handleSearch(new Event('submit') as any);
    } catch (error: any) {
      alert(`Failed to cancel booking: ${error.message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleDownloadReceipt = async (booking: Booking) => {
    try {
      const receiptData: ReceiptData = {
        bookingId: booking.id,
        invoiceNumber: booking.booking_id || `INV-${booking.id}`,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone,
        roomNumber: booking.room.room_number,
        roomType: booking.room.room_type,
        checkInDate: booking.check_in,
        checkOutDate: booking.check_out,
        numberOfNights: booking.number_of_nights,
        pricePerNight: booking.room.price_per_night,
        totalAmount: booking.total_price,
        paymentStatus: booking.payment_status,
        bookingStatus: booking.status,
        hotelName: hotel?.name || 'Larami Holiday Hotel',
        hotelAddress: hotel?.address || 'Port Harcourt, Nigeria',
        hotelPhone: hotel?.phone,
        hotelEmail: hotel?.email,
        issueDate: new Date().toLocaleDateString(),
      };

      // Try PDF first, fall back to text
      const result = await generateReceiptPDF(receiptData);
      if (!result.success) {
        console.warn('PDF generation failed, falling back to text:', result.error);
        downloadReceiptAsText(receiptData);
      }
    } catch (error: any) {
      console.error('Error downloading receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div id="check-reservation" className="py-16 bg-cream">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="text-gold-500 text-xs tracking-[0.35em] uppercase font-body font-light mb-4">
            Manage Your Booking
          </p>
          <div className="flex justify-center mb-4">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#c9901a" />
            </svg>
          </div>
          <h2 className="font-display text-forest-900 font-semibold text-4xl md:text-5xl mb-4">
            Check Your Reservation
          </h2>
          <p className="text-forest-600 font-body font-light text-base md:text-lg max-w-2xl mx-auto">
            Enter your booking details to view, manage, or download your reservation information.
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12 p-8 bg-white rounded-2xl shadow-lg border border-forest-100 overflow-hidden">
          <h3 className="font-display text-forest-900 text-xl font-semibold mb-6">Search Your Reservation</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Search Type */}
            <div className="md:col-span-1">
              <label className="block text-forest-700 text-sm font-semibold mb-2">Search By</label>
              <select
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value as 'booking_id' | 'email' | 'phone');
                  setSearchValue('');
                }}
                className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 bg-white text-forest-900"
              >
                <option value="email">Email Address</option>
                <option value="phone">Phone Number</option>
                <option value="booking_id">Booking ID</option>
              </select>
            </div>

            {/* Search Value */}
            <div className="md:col-span-1">
              <label className="block text-forest-700 text-sm font-semibold mb-2">
                {searchType === 'email' && 'Email Address'}
                {searchType === 'phone' && 'Phone Number'}
                {searchType === 'booking_id' && 'Booking ID'}
              </label>
              <input
                type={searchType === 'email' ? 'email' : 'text'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchType === 'email'
                    ? 'your@email.com'
                    : searchType === 'phone'
                      ? '+234XXXXXXXXXX'
                      : 'BK-001'
                }
                required
                className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-forest-900 placeholder-forest-400"
              />
            </div>

            {/* Search Button */}
            <div className="flex items-end md:col-span-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gold text-forest-900 font-bold py-3 rounded-lg disabled:opacity-50 transition-all font-display text-sm uppercase tracking-wide"
              >
                {loading ? '⏳ Searching...' : '🔍 Search'}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </form>

        {/* Results */}
        {searched && !loading && (
          <div>
            <h3 className="font-display text-forest-900 text-2xl font-semibold mb-8">
              {bookings.length > 0 
                ? `📋 Found ${bookings.length} Booking${bookings.length !== 1 ? 's' : ''}` 
                : '❌ No Bookings Found'}
            </h3>

            {bookings.length > 0 ? (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-forest-100">
                    {/* Booking Header */}
                    <div className="bg-gold-50 p-6 border-b border-gold-200">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <p className="text-forest-500 text-sm font-semibold uppercase">Booking ID</p>
                          <p className="font-display text-forest-900 text-2xl font-semibold">
                            {booking.booking_id || `BK${booking.id}`}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadgeColor(booking.status)}`}>
                            {booking.status || 'PENDING'}
                          </span>
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getPaymentStatusBadgeColor(booking.payment_status)}`}>
                            {booking.payment_status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Guest Info */}
                        <div>
                          <h4 className="text-forest-900 font-semibold mb-3">Guest Information</h4>
                          <div className="space-y-2 text-forest-700 text-sm">
                            <p>
                              <strong>Name:</strong> {booking.guest_name}
                            </p>
                            <p>
                              <strong>Email:</strong> {booking.guest_email}
                            </p>
                            <p>
                              <strong>Phone:</strong> {booking.guest_phone}
                            </p>
                          </div>
                        </div>

                        {/* Room Info */}
                        <div>
                          <h4 className="text-forest-900 font-semibold mb-3">Room Information</h4>
                          <div className="space-y-2 text-forest-700 text-sm">
                            <p>
                              <strong>Room:</strong> {booking.room.room_number} - {booking.room.room_type}
                            </p>
                            <p>
                              <strong>Rate:</strong> ₦{booking.room.price_per_night.toLocaleString()}/night
                            </p>
                            <p>
                              <strong>Nights:</strong> {booking.number_of_nights}
                            </p>
                          </div>
                        </div>

                        {/* Dates */}
                        <div>
                          <h4 className="text-forest-900 font-semibold mb-3">Stay Dates</h4>
                          <div className="space-y-2 text-forest-700 text-sm">
                            <p>
                              <strong>Check-in:</strong> {formatDate(booking.check_in)}
                            </p>
                            <p>
                              <strong>Check-out:</strong> {formatDate(booking.check_out)}
                            </p>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div>
                          <h4 className="text-forest-900 font-semibold mb-3">Pricing</h4>
                          <div className="space-y-2 text-forest-700 text-sm">
                            <p>
                              <strong>Total Amount:</strong> ₦{booking.total_price.toLocaleString()}
                            </p>
                            <p>
                              <strong>Booked on:</strong> {formatDate(booking.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-forest-100 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Status Section */}
                          <div className="md:col-span-2 mb-2">
                            <p className="text-forest-600 text-xs font-semibold uppercase tracking-wider mb-3">Quick Actions</p>
                          </div>

                          {/* Download Receipt - Always Available */}
                          <button
                            onClick={() => handleDownloadReceipt(booking)}
                            className="px-4 py-3 bg-gold-50 border-2 border-gold-400 text-forest-900 rounded-lg font-semibold text-sm hover:bg-gold-100 transition-colors flex items-center justify-center gap-2"
                          >
                            <span>📄</span> Download Reservation
                          </button>

                          {/* Payment Actions */}
                          {booking.payment_status?.toUpperCase() !== 'COMPLETED' ? (
                            <button
                              onClick={() => handleProceedToPayment(booking.id)}
                              disabled={actionLoading[booking.id]}
                              className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                              <span>💬</span>
                              {actionLoading[booking.id] ? 'Opening...' : 'WhatsApp Payment'}
                            </button>
                          ) : (
                            <div className="px-4 py-3 bg-green-50 border-2 border-green-400 text-green-800 rounded-lg font-semibold text-sm flex items-center justify-center gap-2">
                              <span>✓</span> Payment Completed
                            </div>
                          )}

                          {/* Cancellation Button */}
                          {(booking.status?.toUpperCase() === 'PENDING' || booking.status?.toUpperCase() === 'CONFIRMED') && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              disabled={actionLoading[booking.id]}
                              className="px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 md:col-span-2 disabled:opacity-50"
                            >
                              <span>🗑️</span>
                              {actionLoading[booking.id] ? 'Cancelling...' : 'Cancel Reservation'}
                            </button>
                          )}
                        </div>

                        {/* Status Info */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs md:col-span-2">
                          {booking.status?.toUpperCase() === 'PENDING' && booking.payment_status?.toUpperCase() !== 'COMPLETED' && (
                            <p>⏱️ Your booking is pending payment. Complete payment via WhatsApp to confirm your reservation.</p>
                          )}
                          {booking.status?.toUpperCase() === 'CONFIRMED' && (
                            <p>✓ Your booking is confirmed! You can cancel if needed or proceed with your stay.</p>
                          )}
                          {booking.status?.toUpperCase() === 'CHECKED_IN' && (
                            <p>🔑 You are currently checked in. Enjoy your stay!</p>
                          )}
                          {booking.status?.toUpperCase() === 'COMPLETED' && (
                            <p>✓ Your stay has been completed. Thank you for choosing {hotel?.name || 'Larami Holiday Hotel'}!</p>
                          )}
                          {booking.status?.toUpperCase() === 'CANCELLED' && (
                            <p>✗ This reservation has been cancelled.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
