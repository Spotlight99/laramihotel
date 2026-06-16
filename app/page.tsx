import Navbar       from "@/components/Navbar";
import Hero         from "@/components/Hero";
import Rooms        from "@/components/Rooms";
import Facilities   from "@/components/Facilities";
import Testimonials from "@/components/Testimonials";
import Location     from "@/components/Location";
import Contact      from "@/components/Contact";
import Footer       from "@/components/Footer";
import BookingSearch from "@/components/BookingSearch";

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Rooms />
      <BookingSearch />
      <Facilities />
      <Testimonials />
      <Location />
      <Contact />
      <Footer />
    </main>
  );
}
