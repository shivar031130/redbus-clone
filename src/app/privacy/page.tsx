export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-[#0A2540] text-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/70">Last updated: 19 May 2026</p>
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        {[
          {
            title: '1. Information We Collect',
            body: 'We collect information you provide directly to us, such as your full name, email address, phone number, and IC/passport number when you register or make a booking. We also collect device and usage data including IP addresses, browser type, pages visited, and booking behaviour to improve the Service.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'We use the information we collect to: process bookings and payments; send you e-tickets and journey updates; respond to customer support enquiries; personalise your experience and recommend relevant routes; comply with legal obligations; and detect and prevent fraud.',
          },
          {
            title: '3. Sharing of Information',
            body: 'We share your booking and passenger details with the relevant bus operator to facilitate your journey. We do not sell your personal data to third parties. We may share data with payment processors and technology partners under strict data processing agreements. We may disclose data when required by Malaysian law or a court order.',
          },
          {
            title: '4. Data Retention',
            body: 'We retain your account data for as long as your account is active or as needed to provide the Service. Booking records are retained for 7 years to comply with financial and tax regulations. You may request deletion of your account data at any time, subject to our legal obligations.',
          },
          {
            title: '5. Security',
            body: 'We use industry-standard encryption (TLS/HTTPS) for all data in transit. Payment card data is processed directly by our PCI-DSS compliant payment partners and is never stored on our servers. Despite our efforts, no internet transmission is 100% secure.',
          },
          {
            title: '6. Your Rights (PDPA)',
            body: 'Under Malaysia\'s Personal Data Protection Act 2010 (PDPA), you have the right to access, correct, and withdraw consent to the processing of your personal data. To exercise these rights, contact us at privacy@bussphere.my.',
          },
          {
            title: '7. Cookies',
            body: 'We use essential cookies to maintain session state and authentication. We also use analytics cookies to understand how the platform is used. You can control cookie settings in your browser, though disabling essential cookies may affect Service functionality.',
          },
          {
            title: '8. Changes to This Policy',
            body: 'We may update this policy from time to time. We will notify registered users via email for material changes. Your continued use of the Service after changes constitutes acceptance of the updated policy.',
          },
          {
            title: '9. Contact Us',
            body: 'For privacy-related enquiries or data subject requests, contact our Data Protection Officer at privacy@bussphere.my or call +60 3-2345 6789.',
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
