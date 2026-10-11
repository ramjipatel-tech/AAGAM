import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Clock,
  Sparkles,
  Building2,
  Info,
  QrCode,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { api } from '../../services/api';
import { PaymentModal } from '../../components/modals/PaymentModal';
import { OfferLetterViewer } from '../../components/documents/OfferLetterViewer';

interface AcceptOfferPageProps {
  offerIdFromUrl?: string;
  setCurrentView: (view: string) => void;
}

export const AcceptOfferPage: React.FC<AcceptOfferPageProps> = ({
  offerIdFromUrl,
  setCurrentView,
}) => {
  const [offerId, setOfferId] = useState<string>(offerIdFromUrl || '');
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Acceptance & Payment
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);
  const [provisioningStatus, setProvisioningStatus] = useState<string>('Queued');
  const [slaMessage, setSlaMessage] = useState<string>('');

  // Scanner & WhatsApp Payment Flow
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = offerIdFromUrl || params.get('offerId') || params.get('id');
    if (id && id.trim()) {
      setOfferId(id.trim());
      fetchOffer(id.trim());
    } else {
      setLoading(false);
      setError('No Offer Letter ID specified. Please enter your Offer ID below or return to the home page.');
    }
  }, [offerIdFromUrl]);

  const fetchOffer = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getPublicOffer(id);
      if (res.success && res.offer) {
        setOffer(res.offer);
        if (res.offer.status === 'Accepted') {
          setAcceptedSuccess(true);
          setProvisioningStatus(res.offer.provisioning_status || 'Provisioned');
        }
      } else {
        setError(res.message || `Offer letter "${id}" not found in central registry.`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve offer letter details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!offer) return;
    setError(null);
    setLoading(true);

    try {
      const res = await api.acceptOfferPublic(offer.offer_id);
      if (res.isPaymentRequired && res.order) {
        setPaymentOrder(res.order);
        setPaymentModalOpen(true);
      } else {
        setAcceptedSuccess(true);
        setProvisioningStatus(res.provisioning_status || 'Queued');
        setSlaMessage(res.message || 'Offer accepted successfully. Workspace provisioning has started.');
        if (res.credentials) {
          setCredentials(res.credentials);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to accept offer.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (result: any) => {
    setPaymentModalOpen(false);
    setAcceptedSuccess(true);
    setProvisioningStatus(result.provisioning_status || 'Queued');
    setSlaMessage(result.message || 'Payment confirmed and offer accepted! Provisioning has started.');
    if (result.credentials) {
      setCredentials(result.credentials);
    }
    // Refresh offer status
    if (offer?.offer_id) {
      fetchOffer(offer.offer_id);
    }
  };

  const payableFee = (Number(offer?.payable_amount) > 0) ? Number(offer.payable_amount) : 999;
  const upiId = '7079823919@okaxis';
  const whatsappNumber = '917079823919';
  const upiUrl = `upi://pay?pa=${upiId}&pn=AAGAM%20Digital%20Technology&am=${payableFee}&cu=INR&tn=${encodeURIComponent(offer?.offer_id || 'OFFER')}`;
  const qrImageSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  const buildWhatsAppMessage = (utr?: string) => {
    return `*AAGAM Digital Technology - Payment & Offer Verification Request*

*Candidate Name:* ${offer?.student_name || 'Student'}
*Offer ID:* ${offer?.offer_id || offerId}
*Program:* ${offer?.internship_title || 'Engineering Internship'}
*Registered Email:* ${offer?.student_email || offer?.user_email || ''}
*Amount Paid:* ₹${payableFee}
*UTR / Transaction Reference No:* ${utr || utrNumber || 'Pending entry'}

Sir, I have submitted my UTR number on the portal. Please find attached my payment screenshot for verification. Kindly verify and activate my Student Portal credentials.`;
  };

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage(utrNumber))}`;
    window.open(url, '_blank');
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleSubmitProof = async () => {
    if (!offer) return;
    if (!utrNumber.trim() || utrNumber.trim().length < 4) {
      setError('Please enter your 12-digit UPI Transaction / UTR Reference number before submitting.');
      return;
    }
    setError(null);
    setSubmittingProof(true);
    try {
      await api.submitPaymentProof({
        offer_id: offer.offer_id,
        utr_number: utrNumber.trim(),
        amount: payableFee,
      });
      setProofSubmitted(true);
      // Automatically open WhatsApp with autotyped UTR details
      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildWhatsAppMessage(utrNumber.trim()))}`;
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment reference.');
    } finally {
      setSubmittingProof(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-sky-950/80 border border-sky-800/80 text-sky-300">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            Official Candidate Onboarding & Offer Acceptance Portal
          </div>
          <h1 className="text-3xl font-heading font-black tracking-tight text-white">
            AAGAM DIGITAL TECHNOLOGY
          </h1>
          <p className="text-xs text-slate-400">
            Formal Appointment Letter & Verification Gateway • "Learn • Build • Innovate"
          </p>
        </div>

        {error && (
          <div className="p-6 bg-rose-950/70 border border-rose-800 rounded-2xl text-xs text-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span className="font-semibold text-sm">{error}</span>
            </div>
            {/* Offer Lookup Input */}
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="text"
                placeholder="Enter Offer ID (e.g. AAGAM-OFFER-2026-000001)"
                value={offerId}
                onChange={(e) => setOfferId(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs"
              />
              <button
                type="button"
                onClick={() => offerId.trim() && fetchOffer(offerId.trim())}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold transition-colors shrink-0"
              >
                Look Up
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                ← Back to Corporate Website
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentView('internships');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium transition-colors"
              >
                Explore Active Cohorts & Internships →
              </button>
            </div>
          </div>
        )}

        {loading && !offer && (
          <div className="p-12 text-center text-slate-400 text-sm animate-pulse">
            Loading official appointment record from AAGAM central registry...
          </div>
        )}

        {/* Post-Acceptance / Provisioning Banner */}
        {acceptedSuccess && (
          <div className="p-8 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-2 border-emerald-500/80 rounded-3xl text-center space-y-6 shadow-2xl shadow-emerald-950/50">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full border border-emerald-700">
                Offer Accepted & Registration Confirmed
              </span>
              <h2 className="text-2xl font-heading font-black text-white">
                Welcome to AAGAM Digital Technology, {offer?.student_name}!
              </h2>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                {slaMessage ||
                  'Your formal acceptance has been permanently recorded in our ledger. Your onboarding workflow and project workspace are active.'}
              </p>
            </div>

            {/* SLA Timer Notice if queued */}
            {provisioningStatus === 'Queued' && !credentials && (
              <div className="p-4 bg-slate-950/80 border border-sky-500/40 rounded-2xl max-w-md mx-auto text-left flex items-start gap-3">
                <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    Workspace Provisioning SLA: 1 – 2 Hours
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Our engineering system is configuring your private project workspace, repository, and task board. Your portal login credentials will be dispatched directly to <strong className="text-sky-300">{offer?.student_email || 'your email'}</strong> once ready.
                  </p>
                </div>
              </div>
            )}

            {/* Generated Login Credentials Box if available */}
            {credentials && (
              <div className="p-5 bg-slate-950/90 border border-sky-500/60 rounded-2xl max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Student Portal Access Credentials
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username / Email:</span>
                    <span className="text-white font-semibold">{credentials.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Password:</span>
                    <span className="font-mono bg-sky-950 px-2 py-0.5 rounded text-amber-300 font-bold">
                      {credentials.password}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  These credentials have also been dispatched to your email address.
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  setCurrentView('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setCurrentView('portal-student');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-8 py-3 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Go to Student Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Offer Letter Document Viewer */}
        {offer && (
          <div className="space-y-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
              <OfferLetterViewer offer={offer} onAccept={handleAcceptOffer} />

              {/* DEDICATED UPI PAYMENT SCANNER & WHATSAPP VERIFICATION DESK */}
              {!acceptedSuccess && offer.status !== 'Accepted' && (
                <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-sky-500/50 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Official Registration & Verification Gateway
                      </div>
                      <h3 className="font-heading font-black text-xl sm:text-2xl text-white">
                        Scan & Pay via UPI • Confirm on WhatsApp
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Direct administrative desk verification with 1-click credential activation.
                      </p>
                    </div>

                    <div className="text-left sm:text-right bg-slate-900/80 sm:bg-transparent p-3 sm:p-0 rounded-2xl border border-slate-800 sm:border-0">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Onboarding Fee</div>
                      <div className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">
                        ₹{payableFee}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-medium">No Hidden Surcharges</div>
                    </div>
                  </div>

                  {/* Grid: QR Code Scanner on Left, WhatsApp & Steps on Right */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left: QR Code Scanner Box */}
                    <div className="md:col-span-5 flex flex-col items-center text-center p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-sky-400" />
                        <span>UPI Payment QR Scanner</span>
                      </div>

                      {/* QR Image Box */}
                      <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-sky-500/30">
                        <img
                          src={qrImageSrc}
                          alt="UPI QR Scanner"
                          className="w-48 h-48 object-contain rounded-lg"
                        />
                      </div>

                      <div className="space-y-1.5 w-full">
                        <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                          <span>Payee:</span>
                          <span className="text-sky-400">AAGAM DIGITAL TECHNOLOGY</span>
                        </div>

                        {/* UPI ID Row with Copy Button */}
                        <div className="flex items-center justify-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                          <span className="text-slate-300">{upiId}</span>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                            title="Copy UPI ID"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 flex flex-wrap justify-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">GPay</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">PhonePe</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Paytm</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">BHIM</span>
                      </div>
                    </div>

                    {/* Right: WhatsApp CTA & Step-by-Step Instructions */}
                    <div className="md:col-span-7 space-y-5">
                      {/* 4-Step Instructions */}
                      <div className="space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                          <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            1
                          </span>
                          <span>
                            Scan the QR Code with any UPI app and complete payment of <strong className="text-amber-300">₹{payableFee}</strong>.
                          </span>
                        </div>

                        <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                          <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            2
                          </span>
                          <span>
                            Take a screenshot of the successful payment transaction / UTR receipt.
                          </span>
                        </div>

                        <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            3
                          </span>
                          <span>
                            Click the green button below to send your screenshot and message to WhatsApp <strong className="text-emerald-400">+91 7079823919</strong>.
                          </span>
                        </div>

                        <div className="flex items-start gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            4
                          </span>
                          <span>
                            Admin team verifies your receipt, approves offer, and generates your Student ID & Password with weekly course module access!
                          </span>
                        </div>
                      </div>

                      {/* Primary WhatsApp Button */}
                      <button
                        type="button"
                        onClick={handleOpenWhatsApp}
                        className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
                      >
                        <MessageCircle className="w-5 h-5 text-white" />
                        <span>Send Payment Screenshot on WhatsApp (+91 7079823919)</span>
                        <ExternalLink className="w-4 h-4 text-emerald-200" />
                      </button>

                      {/* Verification Status or Submission Box */}
                      {proofSubmitted || offer.provisioning_status === 'Manual_Required' ? (
                        <div className="p-6 bg-amber-950/40 border-2 border-amber-500/80 rounded-2xl space-y-4 text-center">
                          <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
                            <Clock className="w-6 h-6" />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-900/60 px-3 py-0.5 rounded-full border border-amber-700">
                              Payment Proof Submitted • Verification Pending
                            </span>
                            <div className="text-sm font-bold text-white pt-1">
                              UTR: <span className="font-mono text-amber-400">{utrNumber || 'Recorded in Central Registry'}</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              Your UTR reference has been submitted. Please make sure you have sent the payment screenshot on WhatsApp. Once Admin verifies your transaction, your credentials will be generated and emailed to you.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenWhatsApp}
                            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Re-Open WhatsApp Chat (+91 7079823919)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-slate-800 space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>Enter UPI Transaction / UTR Number:</span>
                              <span className="text-rose-400">*</span>
                            </label>
                            <p className="text-[10px] text-slate-400">
                              Enter the 12-digit UTR/Ref from Google Pay, PhonePe, Paytm, or BHIM.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="text"
                              value={utrNumber}
                              onChange={(e) => setUtrNumber(e.target.value)}
                              placeholder="e.g. 412356789012 (12-digit UTR)"
                              className="w-full p-3 bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
                            />

                            <button
                              type="button"
                              onClick={handleSubmitProof}
                              disabled={submittingProof}
                              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xl shadow-emerald-950/50 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
                            >
                              <MessageCircle className="w-4 h-4 text-white" />
                              <span>{submittingProof ? 'Submitting & Opening WhatsApp...' : 'Submit UTR & Send Screenshot on WhatsApp'}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-emerald-200" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Razorpay Payment Modal */}
      {paymentOrder && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          orderData={paymentOrder}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};

