'use client';

import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { bookingsAPI, roomsAPI, APIValidationError } from '@/lib/api';
import { parseValidationError } from '@/lib/apiErrorHandler';
import { generateReceiptPDF, downloadReceiptAsText, ReceiptData } from '@/lib/receiptGenerator';
import { useAuth } from '@/lib/authContext';
import { useHotelInfo } from '@/lib/useHotelInfo';
import { useReservationSummary } from '@/hooks/useReservationSummary';
import { checkRoomAvailability, BookingInfo } from '@/lib/availabilityService';
import BookingReference from '@/components/booking/BookingReference';
import ReservationSummary from '@/components/booking/ReservationSummary';
import PaymentInstructions from '@/components/booking/PaymentInstructions';
import BookingTimeline from '@/components/booking/BookingTimeline';
import SuccessActions from '@/components/booking/SuccessActions';
import { buildWhatsAppUrl } from '@/lib/bookingUtils';

const BOOKING_DATES_STORAGE_KEY = 'larami-booking-dates';

export default function BookingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { hotel } = useHotelInfo();

  const roomId = searchParams.get('room_id');

  const [room, setRoom] = useState<any>(null);
  const [roomLoading, setRoomLoading] = useState(true);
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
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const alertRef = useRef<HTMLDivElement | null>(null);
  const reservationSummary = useReservationSummary({
    bookingResult,
    room,
    bookingDates,
    formData,
    hotel,
  });
  const previousRoomIdRef = useRef<string | null>(roomId);
  const availabilityRequestRef = useRef(0);

  const today = new Date().toISOString().split('T')[0];
  const getNextDay = (value: string) => {
    const nextDate = new Date(value);
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate.toISOString().split('T')[0];
  };
  const minCheckoutDate = bookingDates.checkIn ? getNextDay(bookingDates.checkIn) : today;
  const computedNights = bookingDates.checkIn && bookingDates.checkOut
    ? Math.max(1, Math.ceil((new Date(bookingDates.checkOut).getTime() - new Date(bookingDates.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const nightlyTotal = room?.price_per_night ? room.price_per_night * (computedNights || 1) : 0;
  const estimatedTax = nightlyTotal * 0.075;
  const estimatedTotal = nightlyTotal + estimatedTax;
  const buttonLabel = loading
    ? 'Processing reservation...'
    : availabilityState.loading
      ? 'Checking availability...'
      : availabilityState.checked && availabilityState.available === false
        ? 'Unavailable'
        : 'Confirm reservation';

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

    const requestId = ++availabilityRequestRef.current;
    let isMounted = true;
    setAvailabilityState({ loading: true, checked: false, available: null });

    // Fetch room bookings and check availability using centralized service
    (async () => {
      try {
        const bookings = await bookingsAPI.getRoomBookings(room.id);
        
        if (!isMounted || requestId !== availabilityRequestRef.current) return;

        // Convert to BookingInfo format
        const bookingInfos: BookingInfo[] = bookings.map((booking: any) => ({
          id: booking.id,
          checkIn: booking.check_in,
          checkOut: booking.check_out,
          status: booking.status,
        }));

        // Use centralized availability service
        const result = checkRoomAvailability(bookingInfos, bookingDates.checkIn, bookingDates.checkOut);

        if (isMounted && requestId === availabilityRequestRef.current) {
          setAvailabilityState({ loading: false, checked: true, available: result.available });
        }
      } catch (err: any) {
        if (isMounted && requestId === availabilityRequestRef.current) {
          setAvailabilityState({ loading: false, checked: true, available: false });
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [room?.id, bookingDates.checkIn, bookingDates.checkOut, formData.number_of_guests]);

  const fetchRoom = async () => {
    setRoomLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await fetch(`${apiUrl}/rooms/?t=${Date.now()}`, { cache: 'no-store' });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      let roomsList: any[] = [];
      if (Array.isArray(data)) {
        roomsList = data;
      } else if (data?.results && Array.isArray(data.results)) {
        roomsList = data.results;
      } else {
        setRoom(null);
        return;
      }

      const roomNum = parseInt(roomId!, 10);
      const found = roomsList.find((r: any) => r.id === roomNum);
      setRoom(found || null);
    } catch {
      setRoom(null);
      setError('Failed to load room information');
    } finally {
      setRoomLoading(false);
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

  const handleVerifyPayment = () => {
    const whatsappUrl = bookingResult?.payment_link || buildWhatsAppUrl(reservationSummary.whatsappMessage, formData.guest_phone || bookingResult?.booking?.guest_phone);
    if (typeof window !== 'undefined') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePrintReservation = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownloadReceipt = async () => {
    if (!bookingResult?.booking) return;

    setIsDownloadingReceipt(true);

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
        downloadReceiptAsText(receiptData);
      }
    } catch {
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  // Booking Confirmation Page
  if (bookingResult) {
    return (
      <div className="py-28 bg-cream">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500/20">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-gold-400">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="mb-3 font-display text-4xl font-semibold text-forest-900">Booking Confirmed!</h1>
            <p className="mb-6 text-lg text-forest-600">
              Your reservation is safely recorded. Please complete payment to activate your stay and receive our full hospitality support.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-lg sm:p-8">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Reservation status</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-forest-900">Your stay is on the way</h2>
                    <p className="mt-2 text-sm text-forest-600">
                      We have captured your booking details and prepared a premium confirmation experience for your visit.
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">
                    {bookingResult.booking.payment_status || 'PENDING'}
                  </span>
                </div>

                <div className="mt-6">
                  <BookingReference reference={reservationSummary.bookingReference} />
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <ReservationSummary
                  roomImage={room?.image_url || room?.image}
                  roomName={reservationSummary.roomName}
                  roomNumber={reservationSummary.roomNumber}
                  roomType={room?.room_type || reservationSummary.roomName}
                  guestCount={reservationSummary.guestCount}
                  checkIn={bookingDates.checkIn}
                  checkOut={bookingDates.checkOut}
                  nights={reservationSummary.nights}
                  roomRate={reservationSummary.roomRate}
                />
                <PaymentInstructions
                  amountDue={reservationSummary.total}
                  bookingReference={reservationSummary.bookingReference}
                />
              </div>

              <BookingTimeline />
            </div>

            <div className="space-y-6">
              <div className="sticky top-32 rounded-2xl border border-forest-100 bg-white p-6 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Next steps</p>
                    <h3 className="mt-1 font-display text-xl font-semibold text-forest-900">Complete your payment</h3>
                  </div>
                  <div className="rounded-full bg-forest-50 px-3 py-1 text-sm font-semibold text-forest-700">
                    ₦{reservationSummary.total.toLocaleString()}
                  </div>
                </div>

                <div className="mt-6">
                  <SuccessActions
                    onVerifyPayment={handleVerifyPayment}
                    onDownloadReservation={handleDownloadReceipt}
                    onPrintReservation={handlePrintReservation}
                    isDownloading={isDownloadingReceipt}
                  />
                </div>

                <div className="mt-6 rounded-xl border border-forest-100 bg-forest-50 p-4">
                  <p className="text-sm leading-6 text-forest-600">
                    <span className="font-semibold text-forest-800">Cancellation policy:</span> Free cancellation up to 24 hours before check-in.
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-forest-100 bg-white p-4">
                  <p className="text-sm font-semibold text-forest-800">Need support?</p>
                  <p className="mt-2 text-sm leading-6 text-forest-600">
                    Share your booking reference and we will help verify payment and confirm your stay promptly.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-forest-100 bg-forest-50 p-6 text-center shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-forest-500">Your reservation summary</p>
                <p className="mt-3 text-sm leading-6 text-forest-700">
                  {reservationSummary.guestName} • {reservationSummary.roomName} • {reservationSummary.checkIn} to {reservationSummary.checkOut}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Booking Form Page
  return (
    <div className="py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-forest-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Reservation flow</p>
              <h1 className="font-display text-forest-900 text-3xl font-semibold">Complete Your Booking</h1>
              <p className="mt-2 text-sm text-forest-600">A polished, guided experience for your stay at Larami.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-forest-600" aria-label="Booking progress">
              {[{ label: 'Room & dates', active: true }, { label: 'Guest details', active: true }, { label: 'Confirmation', active: false }].map((step, index) => (
                <span
                  key={step.label}
                  className={`rounded-full px-3 py-2 ${step.active ? 'bg-gold-100 text-forest-900' : 'bg-forest-50 text-forest-500'}`}
                >
                  {index + 1}. {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {alertMessage && (
          <div
            ref={alertRef}
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm transition-all duration-300"
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

        {roomLoading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <div className="animate-pulse rounded-2xl border border-forest-100 bg-white p-8 shadow-lg">
              <div className="mb-6 h-4 w-32 rounded bg-forest-100" />
              <div className="mb-4 h-8 w-3/4 rounded bg-forest-100" />
              <div className="mb-6 h-24 rounded-xl bg-forest-50" />
              <div className="space-y-3">
                <div className="h-12 rounded-lg bg-forest-100" />
                <div className="h-12 rounded-lg bg-forest-100" />
                <div className="h-12 rounded-lg bg-forest-100" />
              </div>
            </div>
            <div className="animate-pulse rounded-2xl border border-forest-100 bg-white p-6 shadow-lg">
              <div className="mb-4 h-4 w-24 rounded bg-forest-100" />
              <div className="mb-6 h-24 rounded-xl bg-forest-50" />
              <div className="space-y-3">
                <div className="h-4 w-3/4 rounded bg-forest-100" />
                <div className="h-4 w-1/2 rounded bg-forest-100" />
              </div>
            </div>
          </div>
        ) : room ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-forest-100 bg-white p-6 shadow-lg sm:p-8">
              <div className="mb-8 rounded-2xl border border-gold-200 bg-gold-50 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Selected room</p>
                    <h2 className="font-display text-forest-900 text-xl font-semibold">{room.room_type} • Room {room.room_number}</h2>
                    <p className="mt-2 text-sm text-forest-600">A refined stay with premium comfort and thoughtful service.</p>
                  </div>
                  <div className="rounded-xl border border-gold-200 bg-white/80 px-4 py-3 text-sm text-forest-700">
                    <p className="font-semibold text-forest-900">₦{room.price_per_night.toLocaleString()} / night</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-forest-500">Flexible check-in support</p>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-forest-200 bg-white/70 p-4 text-sm text-forest-700 transition-all duration-300">
                  {availabilityState.loading ? (
                    <div className="flex items-center gap-2 text-forest-600" role="status">
                      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-gold-500" />
                      <span>Checking live availability for your chosen dates...</span>
                    </div>
                  ) : availabilityState.checked && availabilityState.available === true ? (
                    <p className="text-emerald-700">This room is available for your selected dates.</p>
                  ) : availabilityState.checked && availabilityState.available === false ? (
                    <p className="text-rose-700">This room is no longer available for the selected dates.</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-6 mb-6">
                <h3 className="font-display text-forest-900 text-lg font-semibold">Guest Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="check-in">Check-in Date *</label>
                    <input
                      id="check-in"
                      type="date"
                      min={today}
                      value={bookingDates.checkIn}
                      onChange={(e) => {
                        const nextCheckIn = e.target.value;
                        const nextCheckOut = bookingDates.checkOut && new Date(bookingDates.checkOut) <= new Date(nextCheckIn)
                          ? ''
                          : bookingDates.checkOut;
                        setBookingDates({ checkIn: nextCheckIn, checkOut: nextCheckOut });
                        setValidationErrors((prev) => ({ ...prev, checkIn: '' }));
                        setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
                        setError(null);
                        setAvailabilityState({ loading: false, checked: false, available: null });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                        validationErrors.checkIn || backendErrors.fieldErrors.check_in?.length
                          ? 'border-red-400'
                          : 'border-forest-200'
                      }`}
                      placeholder="YYYY-MM-DD"
                      aria-describedby="date-help"
                    />
                    {validationErrors.checkIn && <p className="mt-2 text-sm text-red-600">{validationErrors.checkIn}</p>}
                    {backendErrors.fieldErrors.check_in?.map((msg, idx) => (
                      <p key={idx} className="mt-2 text-sm text-red-600">{msg}</p>
                    ))}
                  </div>

                  <div>
                    <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="check-out">Check-out Date *</label>
                    <input
                      id="check-out"
                      type="date"
                      min={minCheckoutDate}
                      value={bookingDates.checkOut}
                      onChange={(e) => {
                        setBookingDates((prev) => ({ ...prev, checkOut: e.target.value }));
                        setValidationErrors((prev) => ({ ...prev, checkOut: '' }));
                        setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
                        setError(null);
                        setAvailabilityState({ loading: false, checked: false, available: null });
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 ${
                        validationErrors.checkOut || backendErrors.fieldErrors.check_out?.length
                          ? 'border-red-400'
                          : 'border-forest-200'
                      }`}
                      placeholder="YYYY-MM-DD"
                      aria-describedby="date-help"
                    />
                    {validationErrors.checkOut && <p className="mt-2 text-sm text-red-600">{validationErrors.checkOut}</p>}
                    {backendErrors.fieldErrors.check_out?.map((msg, idx) => (
                      <p key={idx} className="mt-2 text-sm text-red-600">{msg}</p>
                    ))}
                  </div>
                </div>

                <p id="date-help" className="text-sm text-forest-500">Choose dates that keep your stay comfortable and your check-out after your arrival.</p>

                <div>
                  <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="guest-name">Full Name *</label>
                  <input
                    id="guest-name"
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
                    <p key={idx} className="mt-2 text-sm text-red-600">{msg}</p>
                  ))}
                </div>

                <div>
                  <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="guest-email">Email *</label>
                  <input
                    id="guest-email"
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
                    <p key={idx} className="mt-2 text-sm text-red-600">{msg}</p>
                  ))}
                </div>

                <div>
                  <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="guest-phone">Phone Number *</label>
                  <input
                    id="guest-phone"
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
                    <p key={idx} className="mt-2 text-sm text-red-600">{msg}</p>
                  ))}
                </div>

                <div>
                  <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="guest-count">Number of Guests *</label>
                  <select
                    id="guest-count"
                    value={formData.number_of_guests}
                    onChange={(e) => {
                      setFormData({ ...formData, number_of_guests: parseInt(e.target.value, 10) });
                      setBackendErrors({ fieldErrors: {}, nonFieldErrors: [] });
                      setError(null);
                      setAvailabilityState({ loading: false, checked: false, available: null });
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
                  <label className="block text-forest-700 text-sm font-semibold mb-2" htmlFor="special-requests">Special Requests</label>
                  <textarea
                    id="special-requests"
                    value={formData.special_requests}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    placeholder="E.g., Late check-in, extra bed, high floor, etc."
                    rows={4}
                    className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="mb-6 rounded-xl border border-forest-100 bg-forest-50 p-4">
                <p className="text-sm text-forest-600">
                  <strong>✓ Cancellation Policy:</strong> Free cancellation up to 24 hours before check-in.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || availabilityState.loading || (availabilityState.checked && availabilityState.available === false)}
                className="w-full rounded-xl bg-gold-500 px-4 py-3 font-semibold text-forest-900 transition-all duration-300 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {buttonLabel}
              </button>
            </form>

            <aside className="xl:sticky xl:top-24 xl:self-start">
              <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-lg">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Stay summary</p>
                    <h3 className="font-display text-forest-900 text-xl font-semibold">Your reservation</h3>
                  </div>
                  <div className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">
                    Live update
                  </div>
                </div>

                <div className="mb-5 overflow-hidden rounded-xl border border-forest-100">
                  {roomLoading ? (
                    <div className="animate-pulse space-y-3 p-4">
                      <div className="h-20 rounded-lg bg-forest-100" />
                      <div className="h-4 w-2/3 rounded bg-forest-100" />
                      <div className="h-4 w-1/2 rounded bg-forest-100" />
                    </div>
                  ) : (
                    <>
                      <div className="relative h-32">
                        <Image
                          src={room.image_url || 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=900&q=80&auto=format&fit=crop'}
                          alt={room.room_type}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 to-transparent" />
                      </div>
                      <div className="p-4">
                        <p className="font-display text-lg font-semibold text-forest-900">{room.room_type}</p>
                        <p className="text-sm text-forest-600">Room {room.room_number}</p>
                      </div>
                    </>
                  )}
                </div>

                <dl className="space-y-3 text-sm text-forest-700">
                  <div className="flex items-center justify-between">
                    <dt className="text-forest-500">Check-in</dt>
                    <dd className="font-semibold text-forest-900">{bookingDates.checkIn || 'Select date'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-forest-500">Check-out</dt>
                    <dd className="font-semibold text-forest-900">{bookingDates.checkOut || 'Select date'}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-forest-500">Nights</dt>
                    <dd className="font-semibold text-forest-900">{computedNights || 0}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-forest-500">Guests</dt>
                    <dd className="font-semibold text-forest-900">{formData.number_of_guests}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-forest-500">Rate / night</dt>
                    <dd className="font-semibold text-forest-900">₦{room?.price_per_night?.toLocaleString() || 0}</dd>
                  </div>
                </dl>

                <div className="mt-5 border-t border-forest-100 pt-4">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-semibold text-forest-700">Estimated total</span>
                    <span className="font-display text-xl font-semibold text-forest-900">₦{estimatedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-forest-100 bg-white p-8 text-center shadow-lg">
            <p className="text-forest-600">We could not load the selected room. Please return to search and try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
