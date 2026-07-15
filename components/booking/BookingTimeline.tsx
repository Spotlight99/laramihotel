'use client';

const steps = [
  { title: 'Reservation received', detail: 'Your booking request was safely recorded.' },
  { title: 'Payment verification', detail: 'Send your payment receipt via WhatsApp for confirmation.' },
  { title: 'Reservation confirmed', detail: 'We will activate your stay once payment is verified.' },
];

export default function BookingTimeline() {
  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">Booking timeline</p>
      <h3 className="mt-1 font-display text-xl font-semibold text-forest-900">What happens next</h3>

      <div className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-100 text-sm font-semibold text-gold-700">
              {index + 1}
            </div>
            <div>
              <p className="font-semibold text-forest-900">{step.title}</p>
              <p className="mt-1 text-sm text-forest-600">{step.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
