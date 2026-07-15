'use client';

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { roomsAPI } from "@/lib/api";

interface AvailableRoom {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  image_url: string;
  isAvailable: boolean;
}

export default function BookingSearch() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const lastRequestKeyRef = useRef<string | null>(null);
  const requestSequenceRef = useRef(0);
  const today = new Date().toISOString().split('T')[0];
  const minCheckoutDate = checkIn
    ? new Date(new Date(checkIn).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : today;

  useEffect(() => {
    let isMounted = true;

    roomsAPI.getAll()
      .then((rooms) => {
        if (isMounted) {
          setAllRooms(rooms);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAllRooms([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const searchRooms = async () => {
    if (!checkIn || !checkOut) {
      setAvailableRooms([]);
      setSearched(false);
      setStatusMessage('Select both dates to see live availability.');
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      setAvailableRooms([]);
      setSearched(true);
      setStatusMessage('Check-out date must be after check-in date.');
      return;
    }

    const requestKey = `${checkIn}|${checkOut}|${roomType || 'all'}`;
    if (lastRequestKeyRef.current === requestKey) {
      return;
    }

    lastRequestKeyRef.current = requestKey;
    const requestId = ++requestSequenceRef.current;
    setLoading(true);
    setSearched(true);
    setStatusMessage('Checking availability...');

    try {
      const roomCatalog = allRooms.length > 0 ? allRooms : await roomsAPI.getAll();
      if (allRooms.length === 0) {
        setAllRooms(roomCatalog);
      }

      const availableRoomsData = await roomsAPI.getAvailable(checkIn, checkOut, roomType || undefined);

      if (requestId !== requestSequenceRef.current) {
        return;
      }

      const availableRoomIds = new Set(availableRoomsData.map((room: any) => String(room.id)));
      const mergedRooms = (roomType ? roomCatalog.filter((room: any) => room.room_type === roomType) : roomCatalog)
        .map((room: any) => ({
          ...room,
          isAvailable: availableRoomIds.has(String(room.id)),
        }));

      setAvailableRooms(mergedRooms);
      if (mergedRooms.length === 0) {
        setStatusMessage('No rooms match your selected filters.');
      } else if (!mergedRooms.some((room) => room.isAvailable)) {
        setStatusMessage('No rooms are available for those dates. Please try a different range.');
      }
    } catch {
      setAvailableRooms([]);
      setStatusMessage('We could not load availability right now. Please try again.');
    } finally {
      if (requestId === requestSequenceRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailableRooms([]);
      setSearched(false);
      setStatusMessage(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void searchRooms();
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [checkIn, checkOut, roomType]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await searchRooms();
  };

  return (
    <div id="booking-search" className="py-8 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12 p-5 bg-white rounded-2xl shadow-lg border border-forest-100 overflow-hidden">
          <h2 className="font-display text-forest-900 text-2xl font-semibold mb-6">Search Available Rooms</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 w-full">
            {/* Check-in */}
            <div className="min-w-0">
              <label className="block text-forest-700 text-sm font-semibold mb-2">Check-in Date</label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full min-w-0 max-w-full px-3 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500" />
            </div>

            {/* Check-out */}
            <div className="min-w-0">
              <label className="block text-forest-700 text-sm font-semibold mb-2">Check-out Date</label>
              <input
                type="date"
                min={minCheckoutDate}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full min-w-0 max-w-full px-3 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-forest-700 text-sm font-semibold mb-2">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-4 py-3 border border-forest-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
              >
                <option value="">All Types</option>
                <option value="STANDARD">Standard Room</option>
                <option value="DELUXE">Deluxe Room</option>
                <option value="EXECUTIVE">Executive Room</option>
                <option value="SUITE">Suite</option>
                <option value="STUDIO">Studio</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gold-500 px-4 py-3 font-semibold text-forest-900 transition-all duration-300 hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Checking availability...' : 'Search Rooms'}
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div>
            {statusMessage && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900" role="status" aria-live="polite">
                {statusMessage}
              </div>
            )}

            <h3 className="font-display text-forest-900 text-xl font-semibold mb-6">
              {loading ? 'Checking availability...' : `${availableRooms.length} Room${availableRooms.length !== 1 ? 's' : ''} Available`}
            </h3>

            {loading && searched && availableRooms.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-forest-100 bg-white shadow-sm">
                    <div className="h-48 bg-forest-100" />
                    <div className="space-y-3 p-6">
                      <div className="h-4 w-24 rounded bg-forest-100" />
                      <div className="h-5 w-3/4 rounded bg-forest-100" />
                      <div className="h-4 w-full rounded bg-forest-100" />
                      <div className="h-10 rounded-lg bg-forest-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : availableRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableRooms.map((room) => (
                  <div key={room.id} className="card-lift overflow-hidden rounded-2xl border border-forest-50 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={room.image_url}
                        alt={room.room_type}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-display text-forest-900 text-lg font-semibold">
                          Room {room.room_number}
                        </h4>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${room.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {room.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-forest-600 text-sm font-light mb-3">{room.room_type}</p>

                      <div className="mb-4">
                        <p className="text-forest-700 font-display text-2xl font-semibold">
                          ₦{room.price_per_night.toLocaleString()}
                        </p>
                        <p className="text-forest-500 text-xs">per night</p>
                      </div>

                      <div className="mb-4 space-y-2">
                        <p className="text-forest-600 text-sm"><strong>Capacity:</strong> {room.capacity} guests</p>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities.map((amenity) => (
                            <span key={amenity} className="text-xs bg-gold-100 text-forest-900 px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {room.isAvailable ? (
                        <a
                          href={`/booking?room_id=${room.id}&check_in=${checkIn}&check_out=${checkOut}`}
                          className="block w-full rounded-lg bg-gold-500 px-4 py-2.5 text-center font-semibold text-forest-900 transition-all duration-300 hover:bg-gold-400"
                        >
                          Book Now
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="w-full cursor-not-allowed rounded-lg border border-forest-200 bg-forest-50 py-2.5 font-semibold text-forest-500"
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-forest-600 text-lg">No rooms available for your selected dates.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
