'use client';

export const TAX_RATE = 0.075;

export function calculateNights(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

export function calculateSubtotal(pricePerNight: number, nights: number) {
  return Math.max(0, pricePerNight * nights);
}

export function calculateTaxes(subtotal: number, taxRate = TAX_RATE) {
  return subtotal * taxRate;
}

export function calculateGrandTotal(subtotal: number, taxes: number) {
  return subtotal + taxes;
}

export function generateBookingReference(id?: number | string, prefix = 'LAR') {
  if (id === undefined || id === null || id === '') return `${prefix}-2026-0001`;
  return `${prefix}-2026-${String(id).padStart(4, '0')}`;
}

export function generateWhatsAppMessage({
  bookingReference,
  guestName,
  roomName,
  checkIn,
  checkOut,
}: {
  bookingReference: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
}) {
  return [
    'Hello Larami Hotel,',
    'I have completed payment for my reservation.',
    `Booking Reference: ${bookingReference}`,
    `Guest: ${guestName}`,
    `Room: ${roomName}`,
    `Check-in: ${checkIn}`,
    `Check-out: ${checkOut}`,
    'Please find my payment receipt attached.',
    'Thank you.',
  ].join('\n');
}

export function formatReservationDates(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 'Dates pending';

  return `${checkIn} to ${checkOut}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function buildWhatsAppUrl(message: string, phone?: string | null) {
  const encodedMessage = encodeURIComponent(message);
  if (phone) {
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }

  return `https://wa.me/?text=${encodedMessage}`;
}

export function prepareReservationData({
  bookingResult,
  room,
  bookingDates,
  formData,
  hotel,
}: {
  bookingResult: any;
  room: any;
  bookingDates: { checkIn: string; checkOut: string };
  formData: { guest_name: string; guest_email: string; guest_phone: string; number_of_guests: number; special_requests?: string };
  hotel?: any;
}) {
  const nights = calculateNights(bookingDates.checkIn, bookingDates.checkOut);
  const roomRate = room?.price_per_night || bookingResult?.booking?.room?.price_per_night || 0;
  const subtotal = calculateSubtotal(roomRate, nights);
  const taxes = calculateTaxes(subtotal);
  const total = calculateGrandTotal(subtotal, taxes);
  const bookingReference = generateBookingReference(bookingResult?.booking?.id);

  return {
    nights,
    subtotal,
    taxes,
    total,
    bookingReference,
    roomRate,
    bookingId: bookingResult?.booking?.id,
    invoiceNumber: bookingResult?.invoice?.invoice_number || `INV-${bookingResult?.booking?.id || '0000'}`,
    status: bookingResult?.booking?.status || 'PENDING',
    paymentStatus: bookingResult?.booking?.payment_status || 'PENDING',
    guestName: formData.guest_name || bookingResult?.booking?.guest_name || 'Guest',
    guestEmail: formData.guest_email || bookingResult?.booking?.guest_email || '',
    guestPhone: formData.guest_phone || bookingResult?.booking?.guest_phone || '',
    roomName: room?.room_type || bookingResult?.booking?.room?.room_type || 'Selected room',
    roomNumber: room?.room_number || bookingResult?.booking?.room?.room_number || 'N/A',
    checkIn: bookingDates.checkIn,
    checkOut: bookingDates.checkOut,
    guestCount: formData.number_of_guests || bookingResult?.booking?.number_of_guests || 1,
    specialRequests: formData.special_requests || bookingResult?.booking?.special_requests || '',
    hotelName: hotel?.name || 'Larami Holiday Hotel',
    hotelAddress: hotel?.address || 'Port Harcourt, Nigeria',
    hotelPhone: hotel?.phone || '',
    hotelEmail: hotel?.email || '',
    whatsappMessage: generateWhatsAppMessage({
      bookingReference,
      guestName: formData.guest_name || bookingResult?.booking?.guest_name || 'Guest',
      roomName: room?.room_type || bookingResult?.booking?.room?.room_type || 'Selected room',
      checkIn: bookingDates.checkIn,
      checkOut: bookingDates.checkOut,
    }),
  };
}
