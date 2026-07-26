/**
 * Hook for managing room availability with centralized availability engine
 * 
 * This hook encapsulates all availability checking logic for a single room,
 * ensuring all components use the same availability rules.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { checkRoomAvailability, AvailabilityCheckResult, BookingInfo } from '@/lib/availabilityService';
import { bookingsAPI } from '@/lib/api';

export interface UseRoomAvailabilityOptions {
  roomId?: number;
  checkIn?: string;
  checkOut?: string;
  enabled?: boolean;
}

export interface UseRoomAvailabilityResult {
  availability: AvailabilityCheckResult | null;
  loading: boolean;
  error: string | null;
  bookings: BookingInfo[];
}

/**
 * Hook to check room availability
 * 
 * Features:
 * - Automatically fetches bookings when roomId is provided
 * - Uses centralized availability engine for overlap detection
 * - Handles stale request prevention
 * - Debounces requests to prevent API spam
 * 
 * @param options Configuration for availability check
 * @returns Current availability state and bookings
 */
export function useRoomAvailability(
  options: UseRoomAvailabilityOptions
): UseRoomAvailabilityResult {
  const { roomId, checkIn, checkOut, enabled = true } = options;

  const [availability, setAvailability] = useState<AvailabilityCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingInfo[]>([]);

  const requestRef = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!enabled || !roomId || !checkIn || !checkOut) {
      setAvailability(null);
      setBookings([]);
      return;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      // Fetch room bookings
      const roomBookings = await bookingsAPI.getRoomBookings(roomId);
      
      // Convert to BookingInfo format
      const bookingInfos: BookingInfo[] = roomBookings.map((booking: any) => ({
        id: booking.id,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        status: booking.status,
      }));

      setBookings(bookingInfos);

      // Only update if this is the latest request
      if (requestId === requestRef.current) {
        const result = checkRoomAvailability(bookingInfos, checkIn, checkOut);
        setAvailability(result);
      }
    } catch (err: any) {
      if (requestId === requestRef.current) {
        setError(err?.message || 'Failed to check availability');
      }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [enabled, roomId, checkIn, checkOut]);

  // Debounced availability check
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      checkAvailability();
    }, 300); // Debounce by 300ms to prevent API spam

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [checkAvailability]);

  return {
    availability,
    loading,
    error,
    bookings,
  };
}
