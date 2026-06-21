"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { label: "Rooms",             href: "#rooms"             },
  { label: "Check Reservation", href: "#check-reservation" },
  { label: "Facilities",        href: "#facilities"        },
  { label: "Location",          href: "#location"          },
  { label: "Contact",           href: "#contact"           },
];

export default function Navbar() {
  const [scrolled,     setScrolled]     = useState(false);
  const [menuOpen,     setMenuOpen]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-forest-900/95 backdrop-blur-md shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-full bg-gold-400 flex items-center justify-center text-forest-900 font-display font-bold text-sm">
            KV
          </div>
          <span className="font-display text-white text-lg font-semibold tracking-wide">
            Kelvina
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="nav-link text-white/80 hover:text-gold-300 text-sm font-body font-light tracking-widest uppercase transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#booking-search"
            className="btn-gold text-forest-900 text-sm font-bold tracking-wider px-6 py-2.5 rounded-full"
          >
            Book Now
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className={`w-6 flex flex-col gap-1.5 transition-all ${menuOpen ? "gap-0" : ""}`}>
            <span
              className={`h-px bg-white transition-all origin-center ${
                menuOpen ? "rotate-45 translate-y-px" : ""
              }`}
            />
            <span
              className={`h-px bg-white transition-all ${menuOpen ? "opacity-0 w-0" : "w-full"}`}
            />
            <span
              className={`h-px bg-white transition-all origin-center ${
                menuOpen ? "-rotate-45 -translate-y-px" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden bg-forest-900/98 backdrop-blur overflow-hidden transition-all duration-300 ${
          menuOpen ? "max-h-80 py-4" : "max-h-0"
        }`}
      >
        <div className="px-6 flex flex-col gap-4">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="text-white/80 hover:text-gold-300 text-sm font-body tracking-widest uppercase transition-colors py-1 border-b border-white/5"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#booking-search"
            onClick={() => setMenuOpen(false)}
            className="btn-gold text-forest-900 text-sm font-bold tracking-wider px-6 py-3 rounded-full text-center mt-2"
          >
            Book Now
          </a>
        </div>
      </div>
    </header>
  );
}
