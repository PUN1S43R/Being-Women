import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export const Contact = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-12 text-center">Contact Us</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-12">
          <div className="bg-brand-pink-light/40 p-10 rounded-[30px] space-y-8 border border-brand-pink/5">
            <h2 className="text-xl font-bold font-serif text-brand-brown">Get in Touch</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 min-w-0">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-pink flex-shrink-0"><Phone className="w-6 h-6" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Call Us</p>
                  <p className="font-bold text-neutral-800 break-words">+91 78880 00725</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 min-w-0">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-pink flex-shrink-0"><Mail className="w-6 h-6" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Email Us</p>
                  <p className="font-bold text-neutral-800 break-all">beingwomen2026@gmail.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-4 min-w-0">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-pink flex-shrink-0"><MapPin className="w-6 h-6" /></div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Visit Us</p>
                  <p className="font-bold text-neutral-800 leading-snug break-words">INNOV8 SOLITAIRE CORPORATE PARK, 7th Floor, S-11, Unit No. 1171, 1172, SOLITAIRE CORPORATE PARK, ANDHERI (E) Mumbai, Maharashtra-400093</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#241815] to-brand-brown text-white p-10 rounded-[30px] text-center shadow-lg">
            <MessageCircle className="w-12 h-12 mx-auto mb-6 text-brand-pink" />
            <h3 className="text-xl font-bold font-serif mb-4">Chat with us on WhatsApp</h3>
            <p className="text-neutral-300 text-sm mb-8">Our support team is available 24/7 to help you with your queries.</p>
            <a 
              href="https://wa.me/917888000725" 
              target="_blank" 
              className="inline-block bg-gradient-to-r from-brand-pink to-brand-pink-hover text-white px-10 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:shadow-lg transition-all transform hover:-translate-y-0.5 duration-200"
            >
              Start Chat
            </a>
          </div>
        </div>

        <div className="h-[600px] rounded-[3rem] overflow-hidden border border-gray-100 shadow-xl">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3768.456789012345!2d73.0123456!3d19.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTnCsDA3JzI0LjQiTiA3M8KwMDAnNDQuNCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin&q=INNOV8+SOLITAIRE+CORPORATE+PARK+Andheri+East+Mumbai" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
};
