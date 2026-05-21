import { motion } from 'motion/react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-indigo-600 text-white p-12 rounded-[3rem] mb-12 shadow-xl shadow-indigo-100">
          <h1 className="text-4xl font-black mb-4">PinYourPro.co.za</h1>
          <p className="text-xl font-bold opacity-80">Your Trusted South African Service Booking Platform</p>
          <div className="mt-8 pt-8 border-t border-white/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
            <p>Effective Date: May 2026</p>
            <p>Governing Law: Republic of South Africa</p>
            <p>Jurisdiction: South African Courts</p>
            <p>Contact: support@pinyourpro.co.za</p>
          </div>
        </div>

        <div className="prose prose-indigo max-w-none space-y-12 text-gray-600 font-medium leading-relaxed">
          <section className="bg-orange-50 p-8 rounded-3xl border border-orange-100">
            <p className="text-orange-900 font-black text-center uppercase tracking-widest text-sm">Important Notice</p>
            <p className="text-orange-800 mt-4 text-center">PLEASE READ THESE TERMS AND CONDITIONS CAREFULLY BEFORE USING THE PINYOURPRO.CO.ZA PLATFORM. BY REGISTERING AN ACCOUNT OR MAKING A BOOKING, YOU AGREE TO BE LEGALLY BOUND BY THESE TERMS.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">1</span>
              INTRODUCTION AND ACCEPTANCE OF TERMS
            </h2>
            <p>Welcome to PinYourPro.co.za ("PinYourPro", "the Platform", "we", "us", or "our"). PinYourPro is a South African online marketplace that connects consumers ("Users" or "Clients") with verified independent service providers ("Providers") across a range of professional services including but not limited to plumbing, tutoring, personal training, building, handyman services, appliance repair, furniture repair, guesthouses and B&Bs, and machine repair.</p>
            <p className="mt-4">These Terms and Conditions ("Terms") constitute a legally binding agreement between you and PinYourPro.co.za. By accessing, registering on, or using the Platform in any way, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>You have read and understood these Terms in full;</li>
              <li>You are at least 18 years of age or have the consent of a legal guardian;</li>
              <li>You agree to be bound by these Terms and all applicable South African laws;</li>
              <li>If you are registering on behalf of a business, you have the authority to bind that business to these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">2</span>
              DEFINITIONS
            </h2>
            <div className="grid gap-4">
              {[
                { term: 'Platform', def: 'the PinYourPro.co.za website, mobile application, and all associated digital services.' },
                { term: 'User / Client', def: 'any individual or entity that registers on the Platform to book services.' },
                { term: 'Provider', def: 'any individual or business registered on the Platform to offer services.' },
                { term: 'Booking', def: 'a confirmed service reservation made through the Platform between a User and a Provider.' },
                { term: 'Booking Fee', def: 'the non-refundable administrative fee of R50 (fifty Rand) charged by PinYourPro per confirmed Booking.' },
                { term: 'Cancellation Penalty', def: 'a R50 (fifty Rand) fee applied to a User\'s account when they cancel a confirmed Booking, charged on their next subsequent Booking in addition to the standard Booking Fee.' },
                { term: 'Escrow', def: 'the secure payment-holding mechanism used by PinYourPro whereby funds are collected from the User but held and not released to the Provider until the service has been completed and confirmed.' },
                { term: 'Service Fee', def: 'the total amount charged by the Provider for their service, as listed on their PinYourPro profile.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                  <span className="font-black text-gray-900 whitespace-nowrap min-w-[140px]">"{item.term}"</span>
                  <span className="text-gray-500">— {item.def}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">3</span>
              HOW PINYOURPRO.CO.ZA WORKS
            </h2>
            <p>PinYourPro operates as an intermediary marketplace. We do not directly provide any trade, professional, or hospitality services. Our role is to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Verify and list qualified service Providers;</li>
              <li>Facilitate Bookings between Users and Providers;</li>
              <li>Collect, hold, and disburse payments securely through our Escrow system;</li>
              <li>Provide a dispute resolution mechanism;</li>
              <li>Maintain a transparent review and rating system.</li>
            </ul>
          </section>

          <section className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
            <h2 className="text-2xl font-black text-indigo-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm shadow-sm">4</span>
              BOOKING FEE — R50 PER BOOKING
            </h2>
            <p className="text-indigo-900/70">PinYourPro charges a flat Booking Fee of R50 (fifty South African Rand) for every confirmed Booking made on the Platform. This fee is charged to the User at the time of Booking and is non-refundable under any circumstances, including cancellations.</p>
            <div className="mt-6 grid gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-indigo-900"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"/> Automatically added to your Total Payment at checkout</p>
              <p className="flex items-center gap-2 text-sm font-bold text-indigo-900"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"/> Covers admin costs and Escrow maintenance</p>
              <p className="flex items-center gap-2 text-sm font-bold text-indigo-900"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"/> Retained by PinYourPro (not paid to Provider)</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">5</span>
              ESCROW PAYMENT SYSTEM
            </h2>
            <p className="mb-6">The PinYourPro Escrow System is our core trust-and-safety mechanism. When you make a Booking and pay, your payment (excluding the R50 Booking Fee) is held securely by PinYourPro and is NOT released to the Provider until you confirm that the service has been completed to your satisfaction.</p>
            
            <div className="overflow-hidden rounded-3xl border border-gray-100 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Step</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Action</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { step: '1', action: 'User Books', detail: 'User selects Provider and proceeds to checkout.' },
                    { step: '2', action: 'Payment Collected', detail: 'Full amount collected; R50 to PinYourPro, Service Fee to Escrow.' },
                    { step: '3', action: 'Confirmed', detail: 'Provider accepts; payment shown as PENDING on dashboards.' },
                    { step: '4', action: 'Delivered', detail: 'Provider delivers the service at agreed time.' },
                    { step: '5', action: 'User Confirms', detail: 'User hits "Service Completed" in dashboard.' },
                    { step: '6', action: 'Funds Released', detail: 'PinYourPro releases funds to Provider within 24-48h.' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-black text-gray-900">{row.step}</td>
                      <td className="px-6 py-4 font-black text-indigo-600">{row.action}</td>
                      <td className="px-6 py-4 text-sm">{row.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <span className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-sm">7.4</span>
              CANCELLATION PENALTY — R50
            </h2>
            <div className="bg-rose-50 p-8 rounded-3xl border border-rose-100 space-y-4">
              <p className="text-rose-900 font-bold">If a User cancels a confirmed Booking for any reason, a R50 Cancellation Penalty will be automatically recorded on their account and charged on their next Booking.</p>
              <ul className="list-disc pl-6 space-y-2 text-rose-800/80 text-sm">
                <li>Not charged at time of cancellation; applied at checkout on your NEXT booking.</li>
                <li>Cumulative: Multiple cancellations add multiple penalties.</li>
                <li>Purpose: Protect Providers from income loss and discourage casual bookings.</li>
              </ul>
            </div>
          </section>

          <section className="bg-slate-900 text-slate-400 p-12 rounded-[3rem] text-center">
            <h2 className="text-3xl font-black text-white mb-6">Questions?</h2>
            <p className="mb-8">Our support team is here to help you navigate our platform safely.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="mailto:support@pinyourpro.co.za" className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black hover:bg-indigo-600 hover:text-white transition-all">Email Support</a>
              <a href="mailto:disputes@pinyourpro.co.za" className="px-8 py-3 bg-slate-800 text-white rounded-2xl font-black hover:bg-rose-600 transition-all">Disputes</a>
            </div>
            <p className="mt-12 text-[10px] uppercase font-black tracking-[0.2em] opacity-40">BY USING PINYOURPRO.CO.ZA, YOU CONFIRM THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO THESE TERMS AND CONDITIONS.</p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
