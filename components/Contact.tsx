"use client";

import { useState } from "react";

const roomTypes = [
  "Standard Room — ₦25,000 / night",
  "Deluxe Room — ₦35,000 / night",
  "Executive Room — ₦45,000 / night",
];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name:      "",
    phone:     "",
    checkin:   "",
    checkout:  "",
    roomType:  "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  // Build WhatsApp message
  const whatsappMsg = encodeURIComponent(
    `Hello Larami Holiday Hotel,\nI'd like to book a room.\nName: ${form.name || "[Your name]"}\nPhone: ${form.phone || "[Your phone]"}\nCheck-in: ${form.checkin || "[Date]"}\nRoom: ${form.roomType || "[Room type]"}`
  );
  const whatsappUrl = `https://wa.me/2348000000000?text=${whatsappMsg}`;

  return (
    <section id="contact" className="py-28 bg-forest-900 relative overflow-hidden">
      {/* Bg decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-px bg-gold-500/20" />
        <div className="absolute top-20 right-10 w-64 h-64 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-forest-700/20 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-gold-400 text-xs tracking-[0.35em] uppercase font-body font-light mb-4">
            Reservations
          </p>
          <div className="ornament-divider">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#c9901a" />
            </svg>
          </div>
          <h2 className="font-display text-white font-semibold text-4xl md:text-5xl mb-4">
            Book Your Stay
          </h2>
          <p className="text-white/55 font-body font-light text-base md:text-lg max-w-xl mx-auto">
            Fill the form below and we'll confirm your reservation promptly.
            Or reach us instantly via WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center mb-6">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-gold-400">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-display text-white text-2xl mb-3">Booking Received!</h3>
                <p className="text-white/60 font-body font-light text-sm max-w-xs">
                  Thank you, <strong className="text-white">{form.name}</strong>. Our team will contact{" "}
                  <strong className="text-white">{form.phone}</strong> shortly to confirm your reservation.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-gold-400 hover:text-gold-300 text-sm font-body underline transition-colors"
                >
                  Make another booking
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label className="block text-white/60 text-xs tracking-wider uppercase font-body mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g. Chidi Okeke"
                      className="w-full bg-white/6 border border-white/15 focus:border-gold-400 text-white placeholder-white/30 rounded-xl px-4 py-3.5 text-sm font-body outline-none transition-colors duration-200"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-white/60 text-xs tracking-wider uppercase font-body mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="+234 800 000 0000"
                      className="w-full bg-white/6 border border-white/15 focus:border-gold-400 text-white placeholder-white/30 rounded-xl px-4 py-3.5 text-sm font-body outline-none transition-colors duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Check-in */}
                  <div>
                    <label className="block text-white/60 text-xs tracking-wider uppercase font-body mb-2">
                      Check-In Date
                    </label>
                    <input
                      type="date"
                      name="checkin"
                      value={form.checkin}
                      onChange={handleChange}
                      required
                      className="w-full min-w-0 bg-white/6 border border-white/15 focus:border-gold-400 text-white rounded-xl px-4 py-3.5 text-sm font-body outline-none transition-colors duration-200 [color-scheme:dark]"
                    />
                  </div>

                  {/* Check-out */}
                  <div>
                    <label className="block text-white/60 text-xs tracking-wider uppercase font-body mb-2">
                      Check-Out Date
                    </label>
                    <input
                      type="date"
                      name="checkout"
                      value={form.checkout}
                      onChange={handleChange}
                      required
                      className="w-full min-w-0 bg-white/6 border border-white/15 focus:border-gold-400 text-white rounded-xl px-4 py-3.5 text-sm font-body outline-none transition-colors duration-200 [color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Room type */}
                <div>
                  <label className="block text-white/60 text-xs tracking-wider uppercase font-body mb-2">
                    Room Type
                  </label>
                  <select
                    name="roomType"
                    value={form.roomType}
                    onChange={handleChange}
                    required
                    className="w-full bg-white/6 border border-white/15 focus:border-gold-400 text-white rounded-xl px-4 py-3.5 text-sm font-body outline-none transition-colors duration-200 [color-scheme:dark]"
                  >
                    <option value="" disabled className="text-forest-700">Select a room type…</option>
                    {roomTypes.map((r) => (
                      <option key={r} value={r} className="text-forest-900 bg-white">{r}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn-gold w-full text-forest-900 font-bold font-body tracking-wider text-sm uppercase py-4 rounded-xl mt-2"
                >
                  Confirm Booking Request
                </button>
              </form>
            )}
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* WhatsApp CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 p-6 rounded-2xl bg-[#25d366]/10 border border-[#25d366]/25 hover:bg-[#25d366]/18 hover:border-[#25d366]/40 transition-all duration-300 card-lift"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#25d366] flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 2.117.554 4.112 1.523 5.84L.057 23.882l6.233-1.637A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.01-1.377l-.36-.212-3.7.972.988-3.614-.237-.373A9.787 9.787 0 012.182 12C2.182 6.57 6.568 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z" />
                </svg>
              </div>
              <div>
                <p className="text-[#25d366] font-body font-bold text-sm mb-0.5">Chat on WhatsApp</p>
                <p className="text-white/55 font-body font-light text-xs">
                  Get instant response from our team
                </p>
              </div>
            </a>

            {/* Info cards */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-5">
              <h3 className="font-display text-white text-lg font-medium">Need Help?</h3>
              {[
                { icon: "📞", label: "Call us", value: "+234 800 000 0000" },
                { icon: "📧", label: "Email",   value: "stay@laramiholiday.ng" },
                { icon: "🕐", label: "Reception", value: "Open 24 hours" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <p className="text-white/40 text-xs font-body uppercase tracking-wider">{c.label}</p>
                    <p className="text-white text-sm font-body">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Policy note */}
            <div className="p-5 rounded-2xl border border-gold-500/20 bg-gold-500/5">
              <p className="text-gold-400 text-xs font-body font-bold tracking-widest uppercase mb-2">Booking Policy</p>
              <p className="text-white/50 text-xs font-body font-light leading-relaxed">
                Free cancellation up to 24 hours before check-in. ID required at
                check-in. Check-in from 12pm · Check-out by 12pm.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
