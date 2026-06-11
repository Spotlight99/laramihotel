export default function Footer() {
  return (
    <footer className="bg-forest-950 text-white/40 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold-400 flex items-center justify-center text-forest-900 font-display font-bold text-sm">
              LH
            </div>
            <div>
              <p className="font-display text-white text-base font-semibold">Larami Holiday Hotel</p>
              <p className="text-white/40 text-xs font-body">Port Harcourt, Nigeria</p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-xs font-body tracking-widest uppercase">
            {["Rooms", "Facilities", "Location", "Contact"].map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="hover:text-gold-400 transition-colors duration-200"
              >
                {l}
              </a>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            {[
              { label: "Facebook", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
              { label: "Instagram", path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 19.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z" },
              { label: "Twitter", path: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
            ].map((s) => (
              <a
                key={s.label}
                href="#"
                aria-label={s.label}
                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:border-gold-400/50 hover:text-gold-400 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="border-t border-white/6 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-body">
          <p>© {new Date().getFullYear()} Larami Holiday Hotel. All rights reserved.</p>
          <p className="text-white/25">
            Port Harcourt · Rivers State · Nigeria
          </p>
        </div>
      </div>
    </footer>
  );
}
