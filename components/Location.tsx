"use client";

import Image from "next/image";

const highlights = [
  { icon: "�", text: "Accommodation, Suites & Studio Rooms" },
  { icon: "🍽️", text: "Full-service Restaurant" },
  { icon: "🎤", text: "Karaoke Club & Lounge" },
  { icon: "✨", text: "Professional Salon Services" },
];

export default function Location() {
  return (
    <section id="location" className="py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-gold-500 text-xs tracking-[0.35em] uppercase font-body font-light mb-4">
            Find Us
          </p>
          <div className="ornament-divider">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#c9901a" />
            </svg>
          </div>
          <h2 className="font-display text-forest-900 font-semibold text-4xl md:text-5xl mb-4">
            Our Location
          </h2>
          <p className="text-forest-600 font-body font-light text-base md:text-lg max-w-xl mx-auto">
            Located at No 10 Chief Chung Street, Aleto Eleme. A premium destination
            built by Kelvina with world-class facilities and warm hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Map placeholder */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-forest-100 h-96 lg:h-[480px]">
            {/* Satellite-style map image */}
            <Image
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1000&q=80&auto=format&fit=crop"
              alt="Map placeholder"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-forest-900/30" />

            {/* Pin */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="bg-gold-500 text-white rounded-full p-4 shadow-2xl animate-bounce">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" />
                  </svg>
                </div>
                <div className="bg-white/95 backdrop-blur rounded-xl px-4 py-2 shadow-xl text-center">
                  <p className="font-display text-forest-900 text-sm font-semibold">Kelvina Hotel</p>
                  <p className="text-forest-600 text-xs">Port Harcourt</p>
                </div>
              </div>
            </div>

            {/* Map UI hint */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg p-2 text-xs text-forest-500 font-body shadow">
              📍 Interactive map coming soon
            </div>
          </div>

          {/* Right: Info */}
          <div>
            <div className="mb-8">
              <h3 className="font-display text-forest-900 text-2xl font-semibold mb-3">
                Strategically Located in Aleto Eleme
              </h3>
              <p className="text-forest-600 font-body font-light leading-relaxed text-base mb-4">
                Kelvina Hotel is situated at No 10 Chief Chung Street in the heart of Aleto Eleme, Rivers State. Our prime location offers easy access to key business areas and is perfect for both business travelers and leisure visitors.
              </p>
              <p className="text-forest-600 font-body font-light leading-relaxed text-base">
                Built by Kelvina, our hotel offers premium accommodations with world-class facilities including a restaurant, lounge, karaoke club, and more.
              </p>
            </div>

            {/* Highlights list */}
            <div className="space-y-4 mb-8">
              {highlights.map((h) => (
                <div key={h.text} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-forest-50 shadow-sm">
                  <span className="text-2xl">{h.icon}</span>
                  <p className="text-forest-700 font-body text-sm">{h.text}</p>
                </div>
              ))}
            </div>

            {/* Address card */}
            <div className="p-5 rounded-2xl bg-forest-900 text-white">
              <p className="text-gold-400 text-xs tracking-widest uppercase font-body mb-3">Address</p>
              <p className="font-display text-lg mb-1">Kelvina Hotel</p>
              <p className="text-white/60 font-body font-light text-sm">
                No 10 Chief Chung Street, Aleto Eleme,<br />
                Rivers State, Nigeria
              </p>
              <div className="mt-4 flex items-center gap-3">
                <a
                  href="tel:+2348146800508"
                  className="flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-body transition-colors"
                >
                  <span>📞</span>
                  +234 8146800508
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
