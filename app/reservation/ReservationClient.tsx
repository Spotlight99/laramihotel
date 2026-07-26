'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { bookingsAPI } from '@/lib/api';
import { generateReceiptPDF, downloadReceiptAsText, ReceiptData } from '@/lib/receiptGenerator';
import { useHotelInfo } from '@/lib/useHotelInfo';
import GuestDashboard from '@/components/booking/GuestDashboard';
import { generateBookingReference } from '@/lib/bookingUtils';

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
    image_url?: string;
  };
  check_in: string;
  check_out: string;
  status: string;
  payment_status: string;
  total_price: number;
  number_of_nights: number;
  created_at: string;
}

const formatDate = (value: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function ReservationClient() {
  const searchParams = useSearchParams();
  const bookingIdParam = searchParams.get('id') || searchParams.get('booking_id');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hotel } = useHotelInfo();

  useEffect(() => {
    setBooking(null);
    setError(null);

    if (!bookingIdParam) {
      setError('No reservation selected. Please search your booking reference first.');
      return;
    }

    const bookingId = parseInt(bookingIdParam, 10);
    if (Number.isNaN(bookingId)) {
      setError('Invalid booking reference. Please check the reference and try again.');
      return;
    }

    setLoading(true);
    bookingsAPI.getById(bookingId).then((data) => {
      setBooking(data);
    }).catch((err: any) => {
      console.error('Failed to load booking:', err);
      const message = err?.message || 'Reservation not found. Please verify your booking reference.';
      setError(message);
    }).finally(() => {
      setLoading(false);
    });
  }, [bookingIdParam]);

  const bookingReference = booking?.booking_id || (booking ? generateBookingReference(booking.id) : '—');

  const handleDownloadInvoice = async () => {
    if (!booking) return;

    const receiptData: ReceiptData = {
      bookingId: booking.id,
      invoiceNumber: booking.booking_id || `INV-${booking.id}`,
      guestName: booking.guest_name,
      guestEmail: booking.guest_email,
      guestPhone: booking.guest_phone,
      roomNumber: booking.room.room_number,
      roomType: booking.room.room_type,
      checkInDate: formatDate(booking.check_in),
      checkOutDate: formatDate(booking.check_out),
      numberOfNights: booking.number_of_nights,
      pricePerNight: booking.room.price_per_night,
      totalAmount: booking.total_price,
      paymentStatus: booking.payment_status,
      bookingStatus: booking.status,
      hotelName: hotel?.name || 'Larami Holiday Hotel',
      hotelAddress: hotel?.address || 'Port Harcourt, Nigeria',
      hotelPhone: hotel?.phone,
      hotelEmail: hotel?.email,
      issueDate: formatDate(new Date().toISOString()),
    };

    const result = await generateReceiptPDF(receiptData);
    if (!result.success) {
      downloadReceiptAsText(receiptData);
    }
  };

  const handlePrintReservation = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleContactHotel = () => {
    const message = `Hello ${hotel?.name || 'Larami Hotel'},%0A%0AI would like assistance with my reservation ${bookingReference}.%0A%0AThank you.`;
    const phone = hotel?.manager_whatsapp || hotel?.phone || '';
    const url = phone ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}` : `https://wa.me/?text=${message}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmailHotel = () => {
    if (!hotel?.email) return;
    const subject = encodeURIComponent('Reservation Inquiry');
    const body = encodeURIComponent(`Hello ${hotel.name},\n\nI would like assistance with my reservation ${bookingReference}.\n\nThank you.`);
    if (typeof window !== 'undefined') {
      window.location.href = `mailto:${hotel.email}?subject=${subject}&body=${body}`;
    }
  };

  const handleBackToLookup = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/#check-reservation';
    }
  };

  return (
    <main className="bg-cream py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 rounded-[38px] border border-white/15 bg-forest-950/95 p-8 text-white shadow-[0_30px_90px_rgba(5,8,21,0.45)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gold-400/90">Guest reservation dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Manage your reservation with confidence</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/75">Track your booking status, download your invoice, print your reservation, and contact the hotel from one polished guest portal.</p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="animate-pulse rounded-3xl bg-white p-8 shadow-lg" />
            <div className="grid gap-6 md:grid-cols-2">
              <div className="animate-pulse rounded-3xl bg-white p-8 shadow-lg" />
              <div className="animate-pulse rounded-3xl bg-white p-8 shadow-lg" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-white/10 bg-white/95 p-10 shadow-lg">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold-500">Reservation Not Found</p>
              <h2 className="mt-4 text-3xl font-semibold text-forest-900">We couldn&rsquo;t find your booking</h2>
              <p className="mt-4 text-sm leading-7 text-forest-600">Please verify your booking reference and try again, or return to the search page to look up your reservation.</p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <button
                  onClick={handleBackToLookup}
                  className="rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-forest-950 transition hover:bg-gold-400"
                >
                  Back to Reservation Lookup
                </button>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="rounded-full border border-forest-200 bg-white px-6 py-3 text-sm font-semibold text-forest-900 transition hover:bg-forest-50"
                >
                  Clear message
                </button>
              </div>
            </div>
          </div>
        ) : booking ? (
          <GuestDashboard
            booking={booking}
            hotel={hotel}
            onDownloadInvoice={handleDownloadInvoice}
            onPrintReservation={handlePrintReservation}
            onContactHotel={handleContactHotel}
            onEmailHotel={handleEmailHotel}
            isDownloading={false}
          />
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/95 p-10 shadow-lg">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.35em] text-gold-500">Ready to view your reservation</p>
              <h2 className="mt-4 text-3xl font-semibold text-forest-900">No booking reference provided yet</h2>
              <p className="mt-4 text-sm leading-7 text-forest-600">Start from the home page and search using your email, phone, or booking reference to access your guest dashboard.</p>
              <Link href="/" className="mt-8 inline-flex rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-forest-950 transition hover:bg-gold-400">Go to search</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
