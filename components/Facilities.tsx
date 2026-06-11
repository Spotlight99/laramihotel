const facilities = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title:       "Restaurant",
    description: "Enjoy delicious meals at our in-house restaurant with diverse menu options.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.319m.009-.01l-.01.01m5.699-9.368a1.5 1.5 0 11-2.121-2.121m5.304 7.475l-3.182 3.182m3.182-3.182l3.182 3.182" />
      </svg>
    ),
    title:       "Lounge",
    description: "Relax and unwind in our comfortable lounge area with modern amenities.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-10.5M9 9l-3-3m3 3L21 21m-12-12l12 12" />
      </svg>
    ),
    title:       "Karaoke Club",
    description: "Experience fun nights with our state-of-the-art karaoke entertainment.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-18-10.5a6 6 0 00-3 5.197M16.5 4.5a6 6 0 010 11.999m3 0a6 6 0 100-11.999" />
      </svg>
    ),
    title:       "Salon Services",
    description: "Professional salon and spa services to pamper and refresh yourself.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.638 5.214m8.4-1.326a10.726 10.726 0 015.31 2.51M9 12l4 4L21 7" />
      </svg>
    ),
    title:       "Barbecue & Grilling",
    description: "Enjoy outdoor BBQ and grilling facilities for special occasions.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title:       "24hr Security",
    description: "Professional security team and CCTV surveillance keeps you safe all day.",
  },
];

export default function Facilities() {
  return (
    <section id="facilities" className="py-28 bg-forest-900 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold-500/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-forest-700/30 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-gold-400 text-xs tracking-[0.35em] uppercase font-body font-light mb-4">
            Hotel Amenities
          </p>
          <div className="ornament-divider">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#c9901a" />
            </svg>
          </div>
          <h2 className="font-display text-white font-semibold text-4xl md:text-5xl mb-4">
            World-Class Facilities
          </h2>
          <p className="text-white/55 font-body font-light text-base md:text-lg max-w-xl mx-auto">
            Everything you need for a comfortable, stress-free stay — included
            in every booking.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((f) => (
            <div
              key={f.title}
              className="card-lift p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gold-500/15 flex items-center justify-center text-gold-300 mb-4">
                {f.icon}
              </div>
              <h3 className="font-display text-white text-lg font-semibold mb-2">
                {f.title}
              </h3>
              <p className="text-white/55 font-body font-light text-sm">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom strip */}
        <div className="mt-16 p-8 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-white text-lg font-semibold mb-1">
              Ready to Experience Luxury?
            </h3>
            <p className="text-white/60 font-body font-light text-sm">
              Book your stay at Larami Holiday Hotel today.
            </p>
          </div>
          <a
            href="#contact"
            className="btn-gold text-forest-900 font-bold font-body tracking-wider px-10 py-3.5 rounded-full text-sm uppercase whitespace-nowrap"
          >
            Reserve a Room
          </a>
        </div>
      </div>
    </section>
  );
}
