import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  {
    category: 'Booking',
    items: [
      { q: 'How do I book a ticket on redBus?', a: 'Search for your route on the homepage, select your preferred schedule and seats, then proceed to checkout. Payment can be made via FPX, card, or e-wallet.' },
      { q: 'Can I book for multiple passengers?', a: 'Yes! You can select multiple seats in the seat picker and enter each passenger\'s details individually during checkout.' },
      { q: 'How early should I book?', a: 'We recommend booking at least 24–48 hours in advance for popular routes, especially on weekends and public holidays.' },
      { q: 'Is there a booking fee?', a: 'redBuscharges a small service fee of RM 1.00 – RM 2.50 per ticket depending on the operator and route.' },
    ],
  },
  {
    category: 'Tickets & Boarding',
    items: [
      { q: 'Where is my e-ticket?', a: 'Your e-ticket is available in your dashboard under "My Bookings" immediately after a confirmed payment. You can also download a PDF.' },
      { q: 'Do I need to print my ticket?', a: 'No — you can show the digital boarding pass (QR code) directly from your phone to the bus conductor.' },
      { q: 'What if I lose my booking reference?', a: 'Log in to your redBusaccount and navigate to "My Bookings" to find all your active and past bookings.' },
    ],
  },
  {
    category: 'Cancellations & Refunds',
    items: [
      { q: 'Can I cancel my booking?', a: 'Cancellation policies vary by operator. Most operators allow cancellations up to 24 hours before departure for a partial refund. Check the fare rules at booking.' },
      { q: 'How long does a refund take?', a: 'Refunds are processed within 5–14 business days depending on your payment method and bank.' },
      { q: 'What if the bus is cancelled by the operator?', a: 'If an operator cancels a service, you will receive a full automatic refund within 3–5 business days.' },
    ],
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I create an account?', a: 'Click "Sign Up" from the top navigation. You can register as a Traveller for personal bookings or as an Operator to list your bus services.' },
      { q: 'I forgot my password. What do I do?', a: 'Click "Forgot?" on the login page. We\'ll send a password reset link to your registered email address.' },
      { q: 'Can I change my email address?', a: 'Email addresses cannot currently be changed via the settings page. Please contact support for assistance.' },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#0A2540] text-white">
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-white/70 text-xl">Everything you need to know about redBus.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {faqs.map((section) => (
          <div key={section.category}>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b">{section.category}</h2>
            <div className="space-y-4">
              {section.items.map((item) => (
                <details key={item.q} className="group bg-slate-50 rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-semibold text-slate-900 hover:text-primary transition-colors">
                    {item.q}
                    <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform shrink-0 ml-4" />
                  </summary>
                  <div className="px-6 pb-6 text-slate-600 leading-relaxed text-sm border-t border-slate-100 pt-4">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center bg-primary/5 border border-primary/20 rounded-3xl p-10">
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Still have questions?</h3>
          <p className="text-slate-600 mb-6">Our support team is ready to help you any time.</p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </Link>
        </div>
      </section>
    </div>
  );
}
