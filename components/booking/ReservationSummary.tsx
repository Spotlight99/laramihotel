'use client';

import Image from 'next/image';
import { formatCurrency } from '@/lib/bookingUtils';

interface ReservationSummaryProps {
  roomImage?: string;
  roomName: string;
  roomNumber: string;
  roomType: string;
  guestCount: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomRate: number;
}

export default function ReservationSummary({
  roomImage,
  roomName,
  roomNumber,
  roomType,
  guestCount,
  checkIn,
  checkOut,
  nights,
  roomRate,
}: ReservationSummaryProps) {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Reservation summary</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-forest-900">Your stay at Larami</h3>
        </div>
        <span className="rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">
          {nights} night{nights === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-forest-100">
        <div className="relative h-40">
          <Image
            src={roomImage || 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=900&q=80&auto=format&fit=crop'}
            alt={roomName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 to-transparent" />
        </div>
        <div className="bg-white p-4">
          <p className="font-display text-lg font-semibold text-forest-900">{roomName}</p>
          <p className="mt-1 text-sm text-forest-600">{roomType} • Room {roomNumber}</p>
        </div>
      </div>

      <dl className="mt-5 space-y-4 text-sm text-forest-700 pb-3">
        <div className="flex items-center justify-between">
          <dt className="text-forest-500">Guests</dt>
          <dd className="font-semibold text-forest-900">{guestCount}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-forest-500">Check-in</dt>
          <dd className="font-semibold text-forest-900">{checkIn}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-forest-500">Check-out</dt>
          <dd className="font-semibold text-forest-900">{checkOut}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-forest-500">Room rate</dt>
          <dd className="font-semibold text-forest-900">{formatCurrency(roomRate)}</dd>
        </div>
      </dl>
    </div>
  );
}
