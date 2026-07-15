'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { bookingsAPI, roomsAPI, APIValidationError } from '@/lib/api';
import { parseValidationError } from '@/lib/apiErrorHandler';
import { generateReceiptPDF, downloadReceiptAsText, ReceiptData } from '@/lib/receiptGenerator';
import { useAuth } from '@/lib/authContext';
import { useHotelInfo } from '@/lib/useHotelInfo';

const BOOKING_DATES_STORAGE_KEY = 'larami-booking-dates';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { hotel } = useHotelInfo();

  const roomId = searchParams.get('room_id');

  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: user?.email || '',
    guest_phone: '',
    number_of_guests: 1,
    special_requests: '',
  });
  const [bookingDates, setBookingDates] = useState({ checkIn: '', checkOut: '' });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [backendErrors, setBackendErrors] = useState<{ fieldErrors: Record<string, string[]>; nonFieldErrors: string[] }>({ fieldErrors: {}, nonFieldErrors: [] });
  const [availabilityState, setAvailabilityState] = useState<{ loading: boolean; checked: boolean; available: boolean | null }>({ loading: false, checked: false, available: null });
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const previousRoomIdRef = useRef<string | null>(roomId);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initialCheckIn = searchParams.get('check_in')?.trim() || '';
    const initialCheckOut = searchParams.get('check_out')?.trim() || '';

    let storedDates = { checkIn: '', checkOut: '' };
    try {
      const storedValue = window.localStorage.getItem(BOOKING_DATES_STORAGE_KEY);
      if (storedValue) {
        storedDates = JSON.parse(storedValue);
      }
    } catch {
      storedDates = { checkIn: '', checkOut: '' };
    }

    setBookingDates({
      checkIn: initialCheckIn || storedDates.checkIn || '',
      checkOut: initialCheckOut || storedDates.checkOut || '',
    });
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(BOOKING_DATES_STORAGE_KEY, JSON.stringify(bookingDates));
  }, [bookingDates.checkIn, bookingDates.checkOut]);

  useEffect(() => {
    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  useEffect(() => {
    if (previousRoomIdRef.current !== roomId) {
      setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
      setError(null);
      previousRoomIdRef.current = roomId;
    }
  }, [roomId]);

  useEffect(() => {
    if ((error || backendErrors.nonFieldErrors.length > 0) && (bookingDates.checkIn || bookingDates.checkOut)) {
      setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
      setError(null);
    }
  }, [bookingDates.checkIn, bookingDates.checkOut]);

  useEffect(() => {
    if ((error || backendErrors.nonFieldErrors.length > 0) && alertRef.current) {
      requestAnimationFrame(() => {
        alertRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [error, backendErrors.nonFieldErrors]);

  useEffect(() => {
    if (!room?.id || !bookingDates.checkIn || !bookingDates.checkOut) {
      setAvailabilityState({ loading: false, checked: false, available: null });
      return;
    }

    const checkInDate = new Date(bookingDates.checkIn);
    const checkOutDate = new Date(bookingDates.checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      setAvailabilityState({ loading: false, checked: true, available: false });
      return;
    }

    let isMounted = true;
    setAvailabilityState({ loading: true, checked: false, available: null });

    roomsAPI.checkRoomAvailability(room.id, bookingDates.checkIn, bookingDates.checkOut)
      .then((isAvailable) => {
        if (isMounted) {
          setAvailabilityState({ loading: false, checked: true, available: isAvailable });
        }
      })
      .catch(() => {
        if (isMounted) {
          setAvailabilityState({ loading: false, checked: true, available: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [room?.id, bookingDates.checkIn, bookingDates.checkOut]);

  const fetchRoom = async () => {
    console.log('🔥 fetchRoom called, roomId:', roomId);

    try {
      // Fetch directly to bypass any API layer issues
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      console.log('🔥 API URL:', apiUrl);

      const res = await fetch(`${apiUrl}/rooms/?t=${Date.now()}`, { cache: 'no-store' });
      console.log('🔥 Fetch response status:', res.status);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log('🔥 Raw API response:', data);

      // Extract rooms array - handle both formats
      let roomsList: any[] = [];
      if (Array.isArray(data)) {
        roomsList = data;
        console.log('🔥 Data is array');
      } else if (data?.results && Array.isArray(data.results)) {
        roomsList = data.results;
        console.log('🔥 Extracted from data.results');
      } else {
        console.error('🔥 ERROR: Unexpected response format', data);
        setRoom(null);
        return;
      }

      console.log('🔥 Rooms list:', roomsList, 'length:', roomsList.length);

      // Find room
      const roomNum = parseInt(roomId!, 10);
      console.log('🔥 Looking for room id:', roomNum);

      const found = roomsList.find((r: any) => r.id === roomNum);
      console.log('🔥 Found room:', found);

      setRoom(found || null);
    } catch (err: any) {
      console.error('🔥 ERROR:', err?.message || err);
      setRoom(null);
      setError('Failed to load room information');
    }
  };

  const validateBookingForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!bookingDates.checkIn.trim()) {
      nextErrors.checkIn = 'Please select a check-in date.';
    }

    if (!bookingDates.checkOut.trim()) {
      nextErrors.checkOut = 'Please select a check-out date.';
    }

    if (bookingDates.checkIn && bookingDates.checkOut && bookingDates.checkOut <= bookingDates.checkIn) {
      nextErrors.checkOut = 'Check-out date must be after check-in date.';
    }

    if (!formData.guest_name.trim()) {
      nextErrors.guest_name = 'Please enter your full name.';
    }

    if (!formData.guest_email.trim()) {
      nextErrors.guest_email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      nextErrors.guest_email = 'Please enter a valid email address.';
    }

    if (!formData.guest_phone.trim()) {
      nextErrors.guest_phone = 'Please enter your phone number.';
    }

    setValidationErrors(nextErrors);
    return nextErrors;
  };

  const availabilityAlertMessage = availabilityState.checked && availabilityState.available === false
    ? 'This room is no longer available for the selected dates. Please choose different dates or another room.'
    : null;

  const alertMessage = backendErrors.nonFieldErrors.length > 0
    ? `${backendErrors.nonFieldErrors[0]} Please choose different dates or another room.`
    : error || availabilityAlertMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });

    const errors = validateBookingForm();
    if (Object.keys(errors).length > 0) {
      setLoading(false);
      return;
    }

    if (availabilityState.checked && availabilityState.available === false) {
      setError('This room is no longer available for the selected dates. Please choose different dates or another room.');
      setLoading(false);
      return;
    }

    try {
      const result = await bookingsAPI.create({
        ...formData,
        room_id: parseInt(roomId!, 10),
        check_in: bookingDates.checkIn,
        check_out: bookingDates.checkOut,
      });

      setBookingResult(result);
    } catch (error: any) {
      if (error instanceof APIValidationError && error.statusCode === 400) {
        const parsed = parseValidationError(error.data);
        setBackendErrors(parsed);

        if (parsed.nonFieldErrors.length > 0) {
          const availabilityMessage = parsed.nonFieldErrors[0] || 'This room is no longer available for the selected dates.';
          setError(`${availabilityMessage} Please choose different dates or another room.`);
        } else if (Object.keys(parsed.fieldErrors).length > 0) {
          setError('Please review the highlighted fields and try again.');
        } else {
          setError('Something went wrong. Please try again later.');
        }
      } else {
        const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
        if (message.includes('fetch') || message.includes('network') || message.includes('timeout') || message.includes('failed to fetch')) {
          setError('Unable to contact the booking server. Please check your internet connection and try again.');
        } else {
          setError('Something went wrong. Please try again later.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingResult?.booking?.id) return;

    if (
      !confirm(
        'Are you sure you want to cancel this reservation? This action cannot be undone. You may be eligible for a refund according to our cancellation policy.'
      )
    ) {
      return;
    }

    setCancelling(true);
    try {
      await bookingsAPI.cancel(bookingResult.booking.id);
      alert('Booking cancelled successfully. You will be redirected to the homepage.');
      router.push('/');
    } catch (error: any) {
      alert(`Failed to cancel booking: ${error.message}`);
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!bookingResult?.booking) return;

    try {
      // Calculate check-out date
      const checkOutDate = new Date(bookingDates.checkOut);
      const checkInDate = new Date(bookingDates.checkIn);
      const numberOfNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

      const receiptData: ReceiptData = {
        bookingId: bookingResult.booking.id,
        invoiceNumber: bookingResult.invoice?.invoice_number || `INV-${bookingResult.booking.id}`,
        guestName: bookingResult.booking.guest_name,
        guestEmail: bookingResult.booking.guest_email,
        guestPhone: bookingResult.booking.guest_phone,
        roomNumber: bookingResult.booking.room.room_number,
        roomType: bookingResult.booking.room.room_type,
        checkInDate: bookingDates.checkIn,
        checkOutDate: bookingDates.checkOut,
        numberOfNights,
        pricePerNight: bookingResult.booking.room.price_per_night,
        totalAmount: bookingResult.booking.total_price,
        paymentStatus: bookingResult.booking.payment_status || 'PENDING',
        bookingStatus: bookingResult.booking.status || 'PENDING',
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

  // Booking Confirmation Page
  if (bookingResult) {
    return (
      <div className="py-28 bg-cream">
        <div className="max-w-4xl mx-auto px-6">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-gold-400">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="font-display text-forest-900 text-4xl font-semibold mb-3">Booking Confirmed!</h1>
            <p className="text-forest-600 text-lg mb-6">
              Your booking has been successfully received. Please complete payment on WhatsApp to activate your reservation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details Card */}
            <div className="lg:col-span-2">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-forest-100 mb-6">
                <h2 className="font-display text-forest-900 text-2xl font-semibold mb-6 pb-4 border-b border-forest-100">
                  Booking Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Booking & Guest Info */}
                  <div>
                    <h3 className="text-forest-900 font-semibold mb-3">Booking Information</h3>
                    <div className="space-y-2 text-forest-700 text-sm">
                      <p>
                        <strong>Booking ID:</strong>
                        <br />
                        <span className="text-gold-600 font-semibold text-lg">BK{bookingResult.booking.id}</span>
                      </p>
                      <p>
                        <strong>Invoice:</strong> {bookingResult.invoice?.invoice_number || `INV-${bookingResult.booking.id}`}
                      </p>
                      <p>
                        <strong>Status:</strong>
                        <span className="ml-2 inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          {bookingResult.booking.status || 'PENDING'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div>
                    <h3 className="text-forest-900 font-semibold mb-3">Guest Information</h3>
                    <div className="space-y-2 text-forest-700 text-sm">
                      <p>
                        <strong>Name:</strong> {bookingResult.booking.guest_name}
                      </p>
                      <p>
                        <strong>Email:</strong> {bookingResult.booking.guest_email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {bookingResult.booking.guest_phone}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-forest-100 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Room Info */}
                    <div>
                      <h3 className="text-forest-900 font-semibold mb-3">Room Information</h3>
                      <div className="space-y-2 text-forest-700 text-sm">
                        <p>
                          <strong>Room:</strong> {bookingResult.booking.room.room_number}
                        </p>
                        <p>
                          <strong>Type:</strong> {bookingResult.booking.room.room_type}
                        </p>
                        <p>
                          <strong>Rate:</strong> ₦{bookingResult.booking.room.price_per_night.toLocaleString()}/night
                        </p>
                      </div>
                    </div>

                    {/* Stay Dates */}
                    <div>
                      <h3 className="text-forest-900 font-semibold mb-3">Stay Dates</h3>
                      <div className="space-y-2 text-forest-700 text-sm">
                        <p>
                          <strong>Check-in:</strong> {bookingDates.checkIn}
                        </p>
                        <p>
                          <strong>Check-out:</strong> {bookingDates.checkOut}
                        </p>
                        <p>
                          <strong>Nights:</strong> {bookingResult.booking.number_of_nights}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Card */}
              <div className="bg-gold-50 p-8 rounded-2xl border border-gold-200">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-forest-600 text-sm font-semibold uppercase">Total Amount Due</p>
                    <p className="font-display text-forest-900 text-4xl font-semibold">
                      ₦{bookingResult.booking.total_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-forest-600 text-sm">Payment Status</p>
                    <p className="inline-block px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-semibold mt-1">
                      {bookingResult.booking.payment_status || 'PENDING'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-forest-100 sticky top-32">
                <h3 className="font-display text-forest-900 text-lg font-semibold mb-4">Next Steps</h3>

                <div className="space-y-3">
                  {/* Primary Action */}
                  <a
                    href={bookingResult.payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-gold text-forest-900 font-bold py-3 rounded-lg block text-center w-full"
                  >
                    💬 Pay on WhatsApp
                  </a>

                  {/* Download Receipt */}
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full px-4 py-3 border border-forest-300 text-forest-700 rounded-lg font-semibold text-sm hover:bg-forest-50 transition-colors"
                  >
                    📄 Download Receipt
                  </button>

                  {/* Cancel Booking */}
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                    className="w-full px-4 py-3 border border-red-300 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {cancelling ? '⏳ Cancelling...' : '🗑️ Cancel Reservation'}
                  </button>

                  {/* Back to Search */}
                  <a
                    href="#booking-search"
                    className="block text-center px-4 py-3 text-forest-600 font-semibold text-sm hover:text-forest-900 transition-colors"
                  >
                    ← Back to Search
                  </a>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-forest-600 text-xs leading-relaxed">
                    <strong>✓ Cancellation Policy:</strong> Free cancellation up to 24 hours before check-in.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Footer */}
          <div className="mt-12 p-6 bg-forest-50 border border-forest-100 rounded-xl text-center">
            <p className="text-forest-700 text-sm mb-2">
              <strong>Complete your payment on WhatsApp</strong> to confirm your booking. Once the manager confirms payment, your reservation will be activated.
            </p>
            <p className="text-forest-600 text-xs">
              Questions? Check your email for booking confirmation or contact us directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Booking Form Page
  return (
    <div className="py-28 bg-cream">
      <div className="max-w-2xl mx-auto px-6">
        <h1 className="font-display text-forest-900 text-3xl font-semibold mb-2">Complete Your Booking</h1>
        <p className="text-forest-600 mb-8">Fill in your details to reserve your room</p>

        {alertMessage && (
          <div
            ref={alertRef}
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-600">⚠</div>
              <div>
                <p className="font-semibold text-amber-900">Unable to Complete Booking</p>
                <p className="mt-1 text-sm text-amber-800">{alertMessage}</p>
              </div>
            </div>
          </div>
        )}

        {room && (
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg border border-forest-100">
            {/* Room Info */}
            <div className="mb-8 p-6 bg-gold-50 rounded-xl">
              <h2 className="font-display text-forest-900 text-lg font-semibold mb-3">Room Selected</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-forest-600 text-xs uppercase font-semibold">Room Number</p>
                  <p className="text-forest-900 font-semibold">{room.room_number}</p>
                </div>
                <div>
                  <p className="text-forest-600 text-xs uppercase font-semibold">Room Type</p>
                  <p className="text-forest-900 font-semibold">{room.room_type}</p>
                </div>
                <div>
                  <p className="text-forest-600 text-xs uppercase font-semibold">Price per Night</p>
                  <p className="text-forest-900 font-semibold">₦{room.price_per_night.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-forest-600 text-xs uppercase font-semibold">Nights</p>
                  <p className="text-forest-900 font-semibold">{bookingResult?.booking?.number_of_nights || '-'}</p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-forest-200 bg-white/70 p-4 text-sm text-forest-700">
                {availabilityState.loading ? (
                  <p>Checking live availability for your chosen dates...</p>
                ) : availabilityState.checked && availabilityState.available === true ? (
                  <p className="text-emerald-700">This room is available for your selected dates.</p>
                ) : availabilityState.checked && availabilityState.available === false ? (
                  <p className="text-rose-700">This room is no longer available for the selected dates.</p>
                ) : null}
              </div>
            </div>

            {/* Guest Info */}
            <div className="space-y-6 mb-6">
              <h3 className="font-display text-forest-900 text-lg font-semibold">Guest Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-forest-700 text-sm font-semibold mb-2">Check-in Date *</label>
                  <input
                    type="date"
                    value={bookingDates.checkIn}
                    onChange={(e) => {
                      setBookingDates((prev) => ({ ...prev, checkIn: e.target.value }));
                      setValidationErrors((prev) => ({ ...prev, checkIn: '' }));
                      setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
                      setError(null);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                      validationErrors.checkIn || backendErrors.fieldErrors.check_in?.length
                        ? 'border-red-400'
                        : 'border-forest-200'
                    }`}
                    placeholder="YYYY-MM-DD"
                  />
                  {validationErrors.checkIn && <p className="mt-2 text-sm text-red-600">{validationErrors.checkIn}</p>}
                  {backendErrors.fieldErrors.check_in?.map((msg, idx) => (
                    <p key={idx} className="mt-2 text-sm text-red-600">
                      {msg}
                    </p>
                  ))}
                </div>

                <div>
                  <label className="block text-forest-700 text-sm font-semibold mb-2">Check-out Date *</label>
                  <input
                    type="date"
                    value={bookingDates.checkOut}
                    onChange={(e) => {
                      setBookingDates((prev) => ({ ...prev, checkOut: e.target.value }));
                      setValidationErrors((prev) => ({ ...prev, checkOut: '' }));
                      setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
                      setError(null);
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                      validationErrors.checkOut || backendErrors.fieldErrors.check_out?.length
                        ? 'border-red-400'
                        : 'border-forest-200'
                    }`}
                    placeholder="YYYY-MM-DD"
                  />
                  {validationErrors.checkOut && <p className="mt-2 text-sm text-red-600">{validationErrors.checkOut}</p>}
                  {backendErrors.fieldErrors.check_out?.map((msg, idx) => (
                    <p key={idx} className="mt-2 text-sm text-red-600">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.guest_name}
                  onChange={(e) => {
                    setFormData({ ...formData, guest_name: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, guest_name: '' }));
                    setBackendErrors((prev) => ({
                      ...prev,
                      fieldErrors: { ...prev.fieldErrors, guest_name: [] },
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    validationErrors.guest_name || backendErrors.fieldErrors.guest_name?.length
                      ? 'border-red-400'
                      : 'border-forest-200'
                  }`}
                  placeholder="John Doe"
                />
                {validationErrors.guest_name && <p className="mt-2 text-sm text-red-600">{validationErrors.guest_name}</p>}
                {backendErrors.fieldErrors.guest_name?.map((msg, idx) => (
                  <p key={idx} className="mt-2 text-sm text-red-600">
                    {msg}
                  </p>
                ))}
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => {
                    setFormData({ ...formData, guest_email: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, guest_email: '' }));
                    setBackendErrors((prev) => ({
                      ...prev,
                      fieldErrors: { ...prev.fieldErrors, guest_email: [] },
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    validationErrors.guest_email || backendErrors.fieldErrors.guest_email?.length
                      ? 'border-red-400'
                      : 'border-forest-200'
                  }`}
                  placeholder="john@example.com"
                />
                {validationErrors.guest_email && <p className="mt-2 text-sm text-red-600">{validationErrors.guest_email}</p>}
                {backendErrors.fieldErrors.guest_email?.map((msg, idx) => (
                  <p key={idx} className="mt-2 text-sm text-red-600">
                    {msg}
                  </p>
                ))}
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.guest_phone}
                  onChange={(e) => {
                    setFormData({ ...formData, guest_phone: e.target.value });
                    setValidationErrors((prev) => ({ ...prev, guest_phone: '' }));
                    setBackendErrors((prev) => ({
                      ...prev,
                      fieldErrors: { ...prev.fieldErrors, guest_phone: [] },
                    }));
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                    validationErrors.guest_phone || backendErrors.fieldErrors.guest_phone?.length
                      ? 'border-red-400'
                      : 'border-forest-200'
                  }`}
                  placeholder="+234XXXXXXXXXX"
                />
                {validationErrors.guest_phone && <p className="mt-2 text-sm text-red-600">{validationErrors.guest_phone}</p>}
                {backendErrors.fieldErrors.guest_phone?.map((msg, idx) => (
                  <p key={idx} className="mt-2 text-sm text-red-600">
                    {msg}
                  </p>
                ))}
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Number of Guests *</label>
                <select
                  value={formData.number_of_guests}
                  onChange={(e) => {
                    setFormData({ ...formData, number_of_guests: parseInt(e.target.value, 10) });
                    setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
                    setError(null);
                  }}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-forest-700 text-sm font-semibold mb-2">Special Requests</label>
                <textarea
                  value={formData.special_requests}
                  onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                  placeholder="E.g., Late check-in, extra bed, high floor, etc."
                  rows={4}
                  className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="mb-6 p-4 bg-forest-50 rounded-lg border border-forest-100">
              <p className="text-forest-600 text-sm">
                <strong>✓ Cancellation Policy:</strong> Free cancellation up to 24 hours before check-in.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || availabilityState.loading || (availabilityState.checked && availabilityState.available === false)}
              className="btn-gold text-forest-900 font-bold py-3 rounded-lg w-full disabled:opacity-50"
            >
              {loading ? '⏳ Processing...' : 'Book Now'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
