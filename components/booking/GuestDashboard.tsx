'use client';

import BookingReference from '@/components/booking/BookingReference';
import BookingTimeline from '@/components/booking/BookingTimeline';
import ReservationSummary from '@/components/booking/ReservationSummary';
import PaymentInstructions from '@/components/booking/PaymentInstructions';
import SuccessActions from '@/components/booking/SuccessActions';
import { calculateNights, calculateSubtotal, calculateTaxes, formatCurrency, generateBookingReference } from '@/lib/bookingUtils';

interface HotelInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_whatsapp?: string;
}

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
  number_of_guests?: number;
  created_at: string;
}

interface GuestDashboardProps {
  booking: Booking;
  hotel?: HotelInfo | null;
  onDownloadInvoice: () => Promise<void> | void;
  onPrintReservation: () => void;
  onContactHotel: () => void;
  onEmailHotel: () => void;
  isDownloading?: boolean;
}

const getStatusLabel = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'Confirmed';
    case 'cancelled':
      return 'Cancelled';
    case 'checked_in':
    case 'checked in':
      return 'Checked in';
    case 'completed':
      return 'Completed';
    case 'pending':
      return 'Pending';
    default:
      return status || 'Pending';
  }
};

const getPaymentBadge = (paymentStatus: string) => {
  const normalized = paymentStatus?.toLowerCase();
  if (normalized === 'paid' || normalized === 'completed') return 'Paid';
  if (normalized === 'pending' || normalized === 'unpaid') return 'Pending';
  return paymentStatus || 'Pending';
};

export default function GuestDashboard({
  booking,
  hotel,
  onDownloadInvoice,
  onPrintReservation,
  onContactHotel,
  onEmailHotel,
  isDownloading = false,
}: GuestDashboardProps) {
  const bookingReference = booking.booking_id || generateBookingReference(booking.id);
  const nights = booking.number_of_nights || calculateNights(booking.check_in, booking.check_out);
  const subtotal = calculateSubtotal(booking.room.price_per_night, nights);
  const taxes = calculateTaxes(subtotal);
  const guestCount = booking.number_of_guests ?? 1;

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-forest-100 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Booking status</p>
                <h2 className="mt-2 text-3xl font-semibold text-forest-900">{getStatusLabel(booking.status)}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-forest-100 px-4 py-2 text-sm font-semibold text-forest-700">{getPaymentBadge(booking.payment_status)}</span>
                <BookingReference reference={bookingReference} />
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-forest-50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-forest-500">Guest</p>
                <p className="mt-2 text-lg font-semibold text-forest-900">{booking.guest_name}</p>
                <p className="mt-1 text-sm text-forest-600">{booking.guest_email}</p>
                <p className="mt-1 text-sm text-forest-600">{booking.guest_phone}</p>
              </div>
              <div className="rounded-2xl bg-forest-50 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-forest-500">Stay dates</p>
                <p className="mt-2 text-lg font-semibold text-forest-900">{booking.check_in} ↔ {booking.check_out}</p>
                <p className="mt-1 text-sm text-forest-600">{nights} night{nights === 1 ? '' : 's'}</p>
                <p className="mt-2 text-sm text-forest-600">Room {booking.room.room_number} • {booking.room.room_type}</p>
              </div>
            </div>
          </div>

          <ReservationSummary
            roomImage={booking.room.image_url}
            roomName={`Room ${booking.room.room_number}`}
            roomNumber={booking.room.room_number}
            roomType={booking.room.room_type}
            guestCount={guestCount}
            checkIn={booking.check_in}
            checkOut={booking.check_out}
            nights={nights}
            roomRate={booking.room.price_per_night}
          />

          <div className="rounded-3xl border border-forest-100 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Reservation details</p>
                <p className="mt-2 text-base text-forest-700">Reference #{bookingReference} — booked on {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onContactHotel}
                  className="rounded-full bg-gold-500 px-5 py-3 text-sm font-semibold text-forest-950 transition hover:bg-gold-400"
                >
                  Contact hotel
                </button>
                <button
                  type="button"
                  onClick={onEmailHotel}
                  className="rounded-full border border-forest-200 bg-white px-5 py-3 text-sm font-semibold text-forest-700 transition hover:bg-forest-50"
                >
                  Email support
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-forest-100 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Next steps</p>
                <h3 className="mt-2 text-2xl font-semibold text-forest-900">Keep your reservation moving</h3>
              </div>
              <span className="rounded-full bg-forest-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-forest-700">{booking.payment_status === 'paid' ? 'Payment confirmed' : 'Action required'}</span>
            </div>

            <div className="mt-6 space-y-4">
              <PaymentInstructions
                amountDue={Math.max(0, booking.total_price - (booking.payment_status === 'paid' ? booking.total_price : 0))}
                bookingReference={bookingReference}
              />
              <SuccessActions
                onVerifyPayment={onContactHotel}
                onDownloadReservation={onDownloadInvoice}
                onPrintReservation={onPrintReservation}
                isDownloading={isDownloading}
              />
            </div>
          </div>

          <BookingTimeline />
        </div>
      </div>
    </section>
  );
}

