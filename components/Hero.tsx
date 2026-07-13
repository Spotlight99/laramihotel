"use client";

import Image from "next/image";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1800&q=85&auto=format&fit=crop"
        alt="Kelvina Hotel lobby"
        fill
        priority
        fetchPriority="high"
        className="object-cover object-center scale-105"
        style={{ animation: "slowZoom 20s ease-in-out infinite alternate" }}
      />

      {/* Multi-layer overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-950/70 via-forest-950/55 to-forest-950/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/40 via-transparent to-forest-950/20" />

      {/* Decorative corner elements */}
      <div className="absolute top-32 left-8 w-px h-24 bg-gold-400/30" />
      <div className="absolute top-32 left-8 w-24 h-px bg-gold-400/30" />
      <div className="absolute top-32 right-8 w-px h-24 bg-gold-400/30" />
      <div className="absolute top-32 right-8 w-24 h-px bg-gold-400/30" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Eyebrow */}
        <p className="animate-fade-in-up delay-100 text-gold-300 text-xs tracking-[0.35em] uppercase font-body font-light mb-6">
          Port Harcourt, Nigeria
        </p>

        {/* Hotel name */}
        <h1 className="animate-fade-in-up delay-200 font-display text-white font-semibold leading-tight mb-3"
          style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)" }}>
          Kelvina
          <br />
          <span className="italic text-gold-300 font-normal">Hotel</span>
        </h1>

        {/* By Kelvina */}
        <p className="animate-fade-in-up delay-200 text-gold-300 text-xs tracking-[0.2em] uppercase font-body font-light mb-6">
          By Kelvina
        </p>

        {/* Ornament */}
        <div className="animate-fade-in-up delay-200 flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-16 bg-gold-400/60" />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gold-400">
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5Z" fill="currentColor" />
          </svg>
          <div className="h-px w-16 bg-gold-400/60" />
        </div>

        {/* Tagline */}
        <p className="animate-fade-in-up delay-300 text-white/75 font-body font-light text-lg md:text-xl tracking-wide mb-10 max-w-lg mx-auto">
          Comfortable & Affordable Stay in the Heart of Port Harcourt
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#booking-search"
            className="btn-gold text-forest-900 font-bold font-body tracking-wider px-10 py-4 rounded-full text-sm uppercase"
          >
            Book Your Stay
          </a>
          <a
            href="#check-reservation"
            className="border border-white/40 hover:border-gold-400 text-white hover:text-gold-300 font-body font-light tracking-wider px-10 py-4 rounded-full text-sm uppercase transition-all duration-300"
          >
            Check Reservation
          </a>
          <a
            href="#rooms"
            className="border border-white/40 hover:border-gold-400 text-white hover:text-gold-300 font-body font-light tracking-wider px-10 py-4 rounded-full text-sm uppercase transition-all duration-300"
          >
            View Rooms
          </a>
        </div>

        {/* Trust badges */}
        <div className="animate-fade-in-up delay-400 flex items-center justify-center gap-8 mt-16 text-white/50 text-xs font-body tracking-widest uppercase">
          {["24/7 Power", "Free WiFi", "Secure & Safe"].map((b) => (
            <div key={b} className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-gold-400" />
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-[10px] tracking-[0.3em] uppercase font-body">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" style={{ animation: "scrollPulse 2s ease-in-out infinite" }} />
      </div>

      <style jsx>{`
        @keyframes slowZoom {
          from { transform: scale(1.05); }
          to   { transform: scale(1.12); }
        }
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50%       { opacity: 1;   transform: scaleY(1.3); }
        }
      `}</style>
    </section>
  );
}
