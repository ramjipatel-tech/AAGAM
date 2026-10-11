import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const ContactPage: React.FC = () => {
  const { toast } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.submitContact({ name, email, phone, subject, message });
      toast('Your corporate enquiry has been received. Our team will contact you.', 'success');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      toast(err.message || 'Failed to submit message.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
          Direct Communications
        </div>
        <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-slate-900">
          Contact AAGAM Digital Technology
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Connect with our executive leadership, HR team, or university relations desk for admissions and recruitment inquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left 5 Cols: Contact Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
            <h3 className="font-heading font-bold text-2xl text-white">Headquarters & Contacts</h3>

            <div className="space-y-4 text-sm text-slate-300">
              <div className="flex items-start gap-3.5">
                <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">HR Head: Akash Verma</div>
                  <div className="text-base font-bold text-white">
                    <a href="tel:9693335499" className="hover:text-amber-300">
                      9693335499
                    </a>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">akashvermaofficialblogs@gmail.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-800">
                <Phone className="w-5 h-5 text-sky-400 shrink-0 mt-1" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Company Support Lines</div>
                  <div className="text-sm font-semibold text-white space-y-0.5">
                    <div>7667204026</div>
                    <div>9142363927</div>
                    <div>7091465676</div>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-800">
                <Mail className="w-5 h-5 text-sky-400 shrink-0 mt-1" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Official Corporate Email</div>
                  <div className="text-sm font-semibold text-white">AAGAMDigitaltech@gmail.com</div>
                </div>
              </div>

              <div className="flex items-start gap-3.5 pt-3 border-t border-slate-800">
                <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                <div>
                  <div className="text-xs text-slate-400 font-bold uppercase">Operating Hours & SLA</div>
                  <div className="text-xs text-slate-300">Monday - Saturday: 9:30 AM - 7:30 PM IST</div>
                  <div className="text-xs text-emerald-400 font-semibold mt-0.5">48-Hour Review SLA Guarantee</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 7 Cols: Live Form */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-lg space-y-6">
          <div>
            <h3 className="font-heading font-bold text-2xl text-slate-900">Send an Official Message</h3>
            <p className="text-xs text-slate-500 mt-1">Our corporate desk logs and assigns enquiries directly to relevant mentors.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vikram@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mobile Contact *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Internship / College TPO / Hiring"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Detailed Message *</label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your detailed inquiry here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-sky-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Send Corporate Enquiry'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
