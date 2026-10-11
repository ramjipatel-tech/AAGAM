import React, { useState } from 'react';
import { X, ShieldCheck, Lock, CreditCard, Smartphone, Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    paymentId: string;
    paymentNo: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    purpose: string;
  } | null;
  onSuccess: (data?: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, orderData, onSuccess }) => {
  const { user, toast } = useAuth();
  const [method, setMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !orderData) return null;

  const handlePayNow = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Simulate Razorpay Gateway Response & Server Signature Verification
      const mockPaymentId = `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const mockSignature = `demo_sig_${Date.now()}`;

      // Call backend verification endpoint
      const res = await api.verifyPayment({
        razorpay_order_id: orderData.razorpayOrderId,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        method: method.toUpperCase(),
      });

      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        toast('Payment successfully verified! Your offer is accepted.', 'success');
        onSuccess(res);
        onClose();
      }
    } catch (err: any) {
      console.error('[PAYMENT ERROR]', err);
      setError(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Header with Razorpay & AAGAM branding */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-sky-950/80 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-sky-400 to-amber-500 shadow-md">
              <img src="/aagam-logo.jpg" alt="Logo" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <div>
              <div className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> Secure Razorpay Gateway
              </div>
              <h3 className="font-heading font-bold text-white text-base">AAGAM Digital Technology</h3>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount & Purpose Badge */}
        <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Payment Purpose</div>
            <div className="text-xs text-slate-200 font-medium truncate max-w-[220px]">{orderData.purpose}</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Order ID: {orderData.razorpayOrderId}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Amount Due</div>
            <div className="text-2xl font-extrabold text-amber-400 font-heading">₹{orderData.amount}</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMethod('upi')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'upi'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-bold">UPI / QR</div>
                <div className="text-[9px] text-slate-500">GPay, PhonePe</div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('card')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'card'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-bold">Cards</div>
                <div className="text-[9px] text-slate-500">Debit / Credit</div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('netbanking')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  method === 'netbanking'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-5 h-5 mx-auto mb-1 text-sky-400" />
                <div className="text-xs font-bold">Net Banking</div>
                <div className="text-[9px] text-slate-500">All Banks</div>
              </button>
            </div>
          </div>

          {/* Method Details simulation */}
          {method === 'upi' && (
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-2">
              <div className="text-xs text-slate-300">Scan & Pay via any UPI App</div>
              <div className="w-24 h-24 bg-white rounded-lg mx-auto flex items-center justify-center p-1.5 shadow-inner">
                <img src="/aagam-logo.jpg" alt="QR Demo" className="w-20 h-20 object-contain rounded" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">UPI ID: AAGAMDigitaltech@upi</div>
            </div>
          )}

          {method === 'card' && (
            <div className="space-y-2 text-xs">
              <input
                type="text"
                disabled
                value="4111 •••• •••• 1111 (Demo Card)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300"
              />
            </div>
          )}

          {/* Pay Button */}
          <button
            onClick={handlePayNow}
            disabled={processing}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <span>Verifying with Razorpay...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Pay ₹{orderData.amount} & Confirm Offer</span>
              </>
            )}
          </button>

          <div className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>256-Bit SSL Encrypted • Server-side Signature Verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
