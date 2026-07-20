import Navbar       from "@/components/Navbar";
import Hero         from "@/components/Hero";
import Rooms        from "@/components/Rooms";
import Facilities   from "@/components/Facilities";
import Testimonials from "@/components/Testimonials";
import Location     from "@/components/Location";
import Footer       from "@/components/Footer";
import BookingSearch from "@/components/BookingSearch";
import ReservationLookup from "@/components/ReservationLookup";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <BookingSearch />
      <Rooms />
      <section className="py-28 bg-forest-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <ReservationLookup />
        </div>
      </section>
      <Facilities />
      <Testimonials />
      <Location />
      <Footer />
    </main>
  );
}
