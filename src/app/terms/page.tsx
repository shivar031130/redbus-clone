export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#0A2540] text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-white/70">Last updated: 19 May 2026</p>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-6 py-16 space-y-10 prose prose-slate max-w-none">
        {[
          {
            title: '1. Acceptance of Terms',
            body: 'By accessing or using the redBusplatform ("Service"), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the Service.',
          },
          {
            title: '2. Use of the Service',
            body: 'redBusprovides an online platform for booking inter-city bus tickets in Malaysia. You must be at least 18 years of age or have parental consent to use the Service. You agree to provide accurate information when creating an account or making a booking.',
          },
          {
            title: '3. Bookings and Payments',
            body: 'All bookings are subject to seat availability and operator confirmation. Prices displayed include all applicable taxes and service fees. Payment must be made in full at the time of booking. redBusacts as an intermediary between passengers and bus operators; the transport contract is directly between the passenger and the operator.',
          },
          {
            title: '4. Cancellations and Refunds',
            body: 'Cancellation and refund policies are set by individual operators and are displayed at the time of booking. redBus\'s service fee may be non-refundable. Refunds approved by operators will be processed within 5–14 business days. In the event of an operator cancellation, passengers are entitled to a full refund.',
          },
          {
            title: '5. User Responsibilities',
            body: 'You are responsible for arriving at the boarding point on time. redBusis not liable for missed departures. You agree not to use the Service for any unlawful purpose, and not to reproduce, duplicate, or exploit any part of the Service without express written permission.',
          },
          {
            title: '6. Limitation of Liability',
            body: 'redBusacts as a technology intermediary only. We are not responsible for delays, cancellations, accidents, or any other events during the journey. To the maximum extent permitted by Malaysian law, redBus\'s liability shall be limited to the booking fee paid for the affected journey.',
          },
          {
            title: '7. Changes to Terms',
            body: 'We reserve the right to modify these Terms at any time. We will notify registered users of material changes via email. Continued use of the Service after changes constitutes acceptance of the new Terms.',
          },
          {
            title: '8. Governing Law',
            body: 'These Terms are governed by and construed in accordance with the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kuala Lumpur, Malaysia.',
          },
          {
            title: '9. Contact',
            body: 'For questions regarding these Terms, please contact us at legal@redBus.my or write to us at Level 12, Menara TM, Jalan Pantai Baru, 59200 Kuala Lumpur.',
          },
        ].map((section) => (
          <section key={section.title}>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">{section.title}</h2>
            <p className="text-slate-600 leading-relaxed">{section.body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
