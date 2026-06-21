'use client';

import Image from "next/image";
import { useState } from "react";
import { roomsAPI } from "@/lib/api";

interface AvailableRoom {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  amenities: string[];
  image_url: string;
}

export default function BookingSearch() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomType, setRoomType] = useState('');
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const rooms = await roomsAPI.getAvailable(checkIn, checkOut, roomType || undefined);
      setAvailableRooms(rooms);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Failed to search rooms');
    } finally {
      setLoading(false);
    }
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
                className="w-full btn-gold text-forest-900 font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Searching...' : 'Search Rooms'}
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        {searched && (
          <div>
            <h3 className="font-display text-forest-900 text-xl font-semibold mb-6">
              {loading ? 'Searching...' : `${availableRooms.length} Room${availableRooms.length !== 1 ? 's' : ''} Available`}
            </h3>

            {availableRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableRooms.map((room) => (
                  <div key={room.id} className="card-lift bg-white rounded-2xl overflow-hidden shadow-md border border-forest-50">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={room.image_url}
                        alt={room.room_type}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <h4 className="font-display text-forest-900 text-lg font-semibold mb-2">
                        Room {room.room_number}
                      </h4>
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

                      <a
                        href={`/booking?room_id=${room.id}&check_in=${checkIn}&check_out=${checkOut}`}
                        className="btn-gold text-forest-900 font-bold py-2 rounded-lg block text-center w-full"
                      >
                        Book Now
                      </a>
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
