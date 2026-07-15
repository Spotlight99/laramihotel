'use client';

import { useMemo } from 'react';
import { prepareReservationData } from '@/lib/bookingUtils';

interface ReservationSummaryProps {
  bookingResult: any;
  room: any;
  bookingDates: { checkIn: string; checkOut: string };
  formData: { guest_name: string; guest_email: string; guest_phone: string; number_of_guests: number; special_requests?: string };
  hotel?: any;
}

export function useReservationSummary({
  bookingResult,
  room,
  bookingDates,
  formData,
  hotel,
}: ReservationSummaryProps) {
  return useMemo(
    () =>
      prepareReservationData({
        bookingResult,
        room,
        bookingDates,
        formData,
        hotel,
      }),
    [bookingResult, room, bookingDates, formData, hotel]
  );
}
