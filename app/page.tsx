import Navbar       from "@/components/Navbar";
import Hero         from "@/components/Hero";
import Rooms        from "@/components/Rooms";
import Facilities   from "@/components/Facilities";
import Testimonials from "@/components/Testimonials";
import Location     from "@/components/Location";
import Footer       from "@/components/Footer";
import BookingSearch from "@/components/BookingSearch";
import ReservationLookup from "@/components/ReservationLookup";
import BackToTop from "@/components/BackToTop";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <BookingSearch />
      <Rooms />
      <section className="relative overflow-hidden bg-forest-950 py-28 sm:py-32">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 h-px w-[720px] -translate-x-1/2 bg-gold-500/20" />
          <div className="absolute left-10 top-12 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-forest-700/25 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <ReservationLookup />
        </div>
      </section>
      <Facilities />
      <Testimonials />
      <Location />
      <Footer />
      <BackToTop />
    </main>
  );
}
