const testimonials = [
  {
    name:   "Emeka Okafor",
    role:   "Business Traveller",
    rating: 5,
    text:   "Best value hotel in Port Harcourt. The power was on all night, WiFi was fast, and the staff were incredibly warm. Will definitely return on my next trip.",
    avatar: "EO",
  },
  {
    name:   "Ngozi Adeyemi",
    role:   "Family Stay",
    rating: 5,
    text:   "We stayed for a week. The Executive Room was spacious and the room service was prompt. Felt truly at home. The location made it easy to get around PH.",
    avatar: "NA",
  },
  {
    name:   "Daniel Mensah",
    role:   "Corporate Guest",
    rating: 5,
    text:   "Flew in for a conference and needed reliable accommodation. Larami Holiday Hotel exceeded my expectations — quiet, clean, and professional. Highly recommended.",
    avatar: "DM",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-gold-500 text-xs tracking-[0.35em] uppercase font-body font-light mb-4">
            Guest Reviews
          </p>
          <div className="ornament-divider">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 0L8.3 5.7L14 7L8.3 8.3L7 14L5.7 8.3L0 7L5.7 5.7Z" fill="#c9901a" />
            </svg>
          </div>
          <h2 className="font-display text-forest-900 font-semibold text-4xl md:text-5xl mb-4">
            What Our Guests Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="card-lift p-7 rounded-2xl bg-cream border border-forest-50 shadow-sm"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gold-400">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-forest-700 font-body font-light text-sm leading-relaxed mb-6">
                "{t.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest-900 flex items-center justify-center text-gold-400 font-display text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-display text-forest-900 text-sm font-semibold">{t.name}</p>
                  <p className="text-forest-400 text-xs font-body">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
