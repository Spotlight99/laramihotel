"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { roomsAPI } from "@/lib/api";

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  amenities: string[] | string;  // Can be array or string from API
  description: string;
  image_url: string;
}

// Fallback display rooms for when API is unavailable (for UX purposes)
const FALLBACK_ROOMS = [
  {
    name:    "Standard Room",
    price:   "₦25,000",
    tagline: "Cosy comfort for every budget",
    image:   "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=900&q=80&auto=format&fit=crop",
    badge:   "Best Value",
    badgeColor: "bg-forest-700",
    features: [
      { icon: "📶", label: "Free High-Speed WiFi"  },
      { icon: "❄️", label: "Air Conditioning"       },
      { icon: "📺", label: "Smart TV"               },
      { icon: "⚡", label: "24/7 Power Supply"      },
    ],
  },
  {
    name:    "Deluxe Room",
    price:   "₦35,000",
    tagline: "Elevated space and refined comfort",
    image:   "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=900&q=80&auto=format&fit=crop",
    badge:   "Most Popular",
    badgeColor: "bg-gold-500",
    features: [
      { icon: "📶", label: "Free High-Speed WiFi"  },
      { icon: "❄️", label: "Air Conditioning"       },
      { icon: "📺", label: "Smart TV"               },
      { icon: "💼", label: "Work Desk & Chair"      },
    ],
  },
  {
    name:    "Executive Room",
    price:   "₦45,000",
    tagline: "Premium suite for the discerning guest",
    image:   "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80&auto=format&fit=crop",
    badge:   "Premium",
    badgeColor: "bg-forest-900",
    features: [
      { icon: "📶", label: "Free High-Speed WiFi"  },
      { icon: "❄️", label: "Climate Control"        },
      { icon: "📺", label: "Smart TV"               },
      { icon: "🛎️", label: "Priority Room Service" },
    ],
  },
];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [availabilityMap, setAvailabilityMap] = useState<Record<number, boolean>>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const availabilityRequestRef = useRef(0);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await roomsAPI.getAll();
        setRooms(data);
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Failed to load rooms');
        // Show fallback rooms - still functional but not live data
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    if (!checkIn || !checkOut) {
      setAvailabilityMap({});
      setAvailabilityMessage(null);
      return;
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime()) || checkOutDate <= checkInDate) {
      setAvailabilityMap({});
      setAvailabilityMessage('Check-out date must be after check-in date.');
      return;
    }

    const requestId = ++availabilityRequestRef.current;
    let isMounted = true;
    setAvailabilityLoading(true);
    setAvailabilityMessage(null);

    roomsAPI.getAvailable(checkIn, checkOut)
      .then((availableRooms: any[]) => {
        if (!isMounted || requestId !== availabilityRequestRef.current) return;
        const nextAvailability = Object.fromEntries(availableRooms.map((room: any) => [room.id, true]));
        setAvailabilityMap(nextAvailability);
        if (availableRooms.length === 0) {
          setAvailabilityMessage('No rooms are available for those dates.');
        }
      })
      .catch(() => {
        if (!isMounted || requestId !== availabilityRequestRef.current) return;
        setAvailabilityMap({});
        setAvailabilityMessage('We could not verify live availability for those dates.');
      })
      .finally(() => {
        if (isMounted && requestId === availabilityRequestRef.current) {
          setAvailabilityLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [checkIn, checkOut]);

  // Transform API room data to display format
  const displayRooms = rooms.length > 0 
    ? rooms.map((room, index) => {
        // Safely parse amenities - handle string, array, or JSON formats
        let amenitiesArray: string[] = [];
        
        if (Array.isArray(room.amenities)) {
          amenitiesArray = room.amenities.filter((a: any) => typeof a === 'string');
        } else if (typeof room.amenities === 'string') {
          // Try to parse as JSON if it looks like JSON
          if (room.amenities.trim().startsWith('[')) {
            try {
              const parsed = JSON.parse(room.amenities);
              amenitiesArray = Array.isArray(parsed) ? parsed : [room.amenities];
            } catch {
              // Not valid JSON, split by comma
              amenitiesArray = room.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a);
            }
          } else {
            // Regular comma-separated or single string
            amenitiesArray = room.amenities.split(',').map((a: string) => a.trim()).filter((a: string) => a);
          }
        }
        
        return {
          id: room.id,
          name: room.room_type,
          price: `₦${room.price_per_night.toLocaleString()}`,
          tagline: room.description || `${room.capacity} guest${room.capacity !== 1 ? 's' : ''} max`,
          // Backend now provides image_url with fallback, so always use it
          image: room.image_url || FALLBACK_ROOMS[index % FALLBACK_ROOMS.length].image,
          badge: index === 0 ? "Featured" : (index === 1 ? "Popular" : "Available"),
          badgeColor: index === 0 ? "bg-gold-500" : (index === 1 ? "bg-forest-700" : "bg-forest-600"),
          features: amenitiesArray.slice(0, 4).map((amenity) => ({
            icon: "✓",
            label: amenity,
          })),
          capacity: room.capacity,
        };
      })
    : FALLBACK_ROOMS.map((room, index) => ({
        ...room,
        id: index,
        features: room.features,
        capacity: 2,
      }));

  return (
    <section id="rooms" className="py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-gold-500 text-xs tracking-[0.35em] uppercase font-body font-light mb-4">
            Accommodation
          </p>
          <div className="ornament-divider">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#c9901a" />
            </svg>
          </div>
          <h2 className="font-display text-forest-900 font-semibold text-4xl md:text-5xl mb-4">
            Our Rooms & Suites
          </h2>
          <p className="text-forest-600 font-body font-light text-base md:text-lg max-w-xl mx-auto">
            {loading ? (
              'Loading rooms...'
            ) : error ? (
              <span className="text-red-600">⚠️ Unable to load live rooms. Showing sample rooms below.</span>
            ) : (
              'Every room is thoughtfully designed for comfort, equipped with modern amenities and reliable 24/7 power.'
            )}
          </p>
        </div>

        <div className="mb-10 rounded-2xl border border-forest-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-display text-forest-900 text-xl font-semibold">Check live availability</h3>
              <p className="text-forest-600 text-sm">Pick dates to see which rooms are open for your stay.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-lg border border-forest-200 px-3 py-2.5"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-forest-600">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-lg border border-forest-200 px-3 py-2.5"
                />
              </div>
            </div>
          </div>

          {availabilityLoading && <p className="mt-4 text-sm text-forest-600">Checking availability...</p>}
          {availabilityMessage && <p className="mt-4 text-sm text-amber-700">{availabilityMessage}</p>}
        </div>

        {/* Room cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayRooms.map((room) => (
            <div
              key={room.id}
              className="card-lift bg-white rounded-2xl overflow-hidden shadow-md border border-forest-50 flex flex-col"
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={room.image}
                  alt={room.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/50 via-transparent to-transparent" />
                {/* Badge */}
                <span
                  className={`absolute top-4 right-4 ${room.badgeColor} text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full`}
                >
                  {room.badge}
                </span>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-forest-900 text-xl font-semibold mb-1">
                      {room.name}
                    </h3>
                    {checkIn && checkOut ? (
                      availabilityMap[room.id] ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                          Available
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700">
                          Unavailable
                        </span>
                      )
                    ) : null}
                  </div>
                  <p className="text-forest-500 font-body font-light text-sm">
                    {room.tagline}
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6 flex-1">
                  {room.features.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-center gap-3 text-forest-700 text-sm font-body"
                    >
                      <span>{f.icon}</span>
                      {f.label}
                    </li>
                  ))}
                </ul>

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-4 border-t border-forest-50">
                  <div>
                    <p className="text-forest-400 text-xs font-body tracking-wide">From</p>
                    <p className="font-display text-forest-900 text-lg font-semibold">{room.price}</p>
                  </div>
                  {checkIn && checkOut && availabilityMap[room.id] === false ? (
                    <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
                      Unavailable
                    </span>
                  ) : (
                    <a
                      href={`/booking?room_id=${room.id}`}
                      className="btn-gold text-forest-900 text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded-full font-body"
                    >
                      Book Now
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading/Error state */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-forest-600">Loading room information...</p>
          </div>
        )}

        {error && (
          <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
            <p className="text-forest-600">
              Currently unable to load live room data. Please use the booking search to check availability or contact us directly.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
