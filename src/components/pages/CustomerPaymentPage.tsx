import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  User,
  CreditCard,
  QrCode,
  Smartphone,
  Printer,
  ArrowLeft,
  AlertCircle,
  Clock,
  Download,
  Lock,
  Loader2,
  ExternalLink,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { paymentLinkService, PublicPaymentPageData } from '../../services/paymentLinkService';
import { CollectIQLogo } from '../common/Graphics';

interface CustomerPaymentPageProps {
  token: string;
  onBackToApp?: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CustomerPaymentPage: React.FC<CustomerPaymentPageProps> = ({ token, onBackToApp }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicPaymentPageData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Partial payment state
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [simulatedMethod, setSimulatedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [simulatedUpiId, setSimulatedUpiId] = useState('customer@okhdfcbank');

  // Success state
  const [paymentSuccess, setPaymentSuccess] = useState<{
    receiptNumber: string;
    paymentId: string;
    amountPaid: number;
    balanceRemaining: number;
    paidAt: string;
    paymentMethod: string;
  } | null>(null);

  useEffect(() => {
    loadPaymentData();
  }, [token]);

  const loadPaymentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await paymentLinkService.getPaymentLinkByToken(token);
      if (result.success && result.data) {
        setData(result.data);
        setCustomAmount(String(result.data.balance));
      } else {
        setError(result.error || 'Payment link expired or not found.');
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching payment information.');
    } finally {
      setLoading(false);
    }
  };

  const getEffectiveAmount = (): number => {
    if (!data) return 0;
    if (paymentType === 'full') {
      return data.balance;
    }
    const val = parseFloat(customAmount);
    return isNaN(val) ? 0 : val;
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    setAmountError(null);
    const num = parseFloat(val);
    if (!data) return;

    if (isNaN(num) || num <= 0) {
      setAmountError('Please enter a valid payment amount.');
    } else if (data.minPartialAmount && num < data.minPartialAmount && num < data.balance) {
      setAmountError(`Minimum partial payment is ₹${data.minPartialAmount.toLocaleString('en-IN')}`);
    } else if (num > data.balance) {
      setAmountError(`Amount cannot exceed the balance due of ₹${data.balance.toLocaleString('en-IN')}`);
    }
  };

  // Dynamically load Razorpay standard checkout script
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async () => {
    if (!data) return;
    const payAmount = getEffectiveAmount();

    // Validation
    if (payAmount <= 0) {
      setAmountError('Please enter an amount greater than 0.');
      return;
    }
    if (data.minPartialAmount && paymentType === 'partial' && payAmount < data.minPartialAmount && payAmount < data.balance) {
      setAmountError(`Minimum allowed partial amount is ₹${data.minPartialAmount.toLocaleString('en-IN')}`);
      return;
    }
    if (payAmount > data.balance) {
      setAmountError(`Amount cannot exceed the total balance of ₹${data.balance.toLocaleString('en-IN')}`);
      return;
    }

    setIsProcessing(true);
    setAmountError(null);

    try {
      // 1. Create order on backend
      const orderRes = await paymentLinkService.createPaymentOrder(token, payAmount);

      if (!orderRes.success || !orderRes.orderId) {
        throw new Error(orderRes.error || 'Failed to initialize payment order.');
      }

      // If Razorpay live gateway is active, open official Razorpay Checkout modal
      if (data.isLiveGateway && !orderRes.isSandbox) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
        }

        const options = {
          key: orderRes.keyId || data.razorpayKeyId,
          amount: orderRes.amountInPaise,
          currency: 'INR',
          name: data.businessName,
          description: `Payment for Invoice #${data.invoiceNumber}`,
          order_id: orderRes.orderId,
          prefill: {
            name: data.customerName,
            email: data.customerEmail,
            contact: data.customerPhone || '',
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async function (response: any) {
            // Verify signature on backend
            const verifyRes = await paymentLinkService.verifyPayment({
              token,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              amountPaid: payAmount,
              paymentMethod: 'Razorpay Online Gateway',
            });

            if (verifyRes.success && verifyRes.verified) {
              setPaymentSuccess({
                receiptNumber: verifyRes.receiptNumber || `RCP-${response.razorpay_payment_id.slice(-6)}`,
                paymentId: response.razorpay_payment_id,
                amountPaid: payAmount,
                balanceRemaining: verifyRes.balanceRemaining ?? Math.max(0, data.balance - payAmount),
                paidAt: new Date().toISOString(),
                paymentMethod: 'UPI / Cards / Net Banking',
              });
              setData((prev) => (prev ? { ...prev, balance: verifyRes.balanceRemaining ?? 0 } : null));
            } else {
              setAmountError(verifyRes.error || 'Payment signature verification failed.');
            }
            setIsProcessing(false);
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Sandbox/Simulated Interactive Indian Checkout Modal
        setShowSimulatedModal(true);
      }
    } catch (err: any) {
      setAmountError(err.message || 'Payment initiation failed.');
      setIsProcessing(false);
    }
  };

  const handleSimulatedSubmit = async () => {
    if (!data) return;
    const payAmount = getEffectiveAmount();
    setIsProcessing(true);

    try {
      const simPaymentId = `pay_sim_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const simOrderId = `order_sim_${Date.now()}`;

      const verifyRes = await paymentLinkService.verifyPayment({
        token,
        razorpayOrderId: simOrderId,
        razorpayPaymentId: simPaymentId,
        razorpaySignature: 'simulated_authorized_signature',
        amountPaid: payAmount,
        paymentMethod: simulatedMethod === 'upi' ? `UPI (${simulatedUpiId})` : simulatedMethod === 'card' ? 'Visa / Mastercard Card' : 'Net Banking',
      });

      if (verifyRes.success) {
        setShowSimulatedModal(false);
        setPaymentSuccess({
          receiptNumber: verifyRes.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
          paymentId: simPaymentId,
          amountPaid: payAmount,
          balanceRemaining: verifyRes.balanceRemaining ?? Math.max(0, data.balance - payAmount),
          paidAt: new Date().toISOString(),
          paymentMethod: simulatedMethod === 'upi' ? `UPI (${simulatedUpiId})` : 'Indian Banking Gateway',
        });
        setData((prev) => (prev ? { ...prev, balance: verifyRes.balanceRemaining ?? 0 } : null));
      } else {
        setAmountError(verifyRes.error || 'Simulated payment processing error.');
      }
    } catch (err: any) {
      setAmountError(err.message || 'Verification error.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <CollectIQLogo size={42} />
          <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm">
            <Loader2 size={18} className="animate-spin" />
            <span>Loading secure payment details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100">
          <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Payment Link Expired or Unavailable</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error || 'This payment link has either been revoked, fully settled, or has expired. Please contact the business for a new link.'}
          </p>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors w-full shadow-md shadow-indigo-100"
            >
              <ArrowLeft size={16} />
              Return to CollectIQ
            </button>
          )}
        </div>
      </div>
    );
  }

  // Already Paid or Expired view
  if (data.status === 'paid' && !paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Invoice Fully Settled</h2>
          <p className="text-sm text-slate-500 mb-4">
            Invoice <span className="font-semibold text-slate-700">#{data.invoiceNumber}</span> has already been fully paid.
          </p>
          <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100 text-emerald-800 text-sm font-medium mb-6">
            Total Amount: ₹{data.amount.toLocaleString('en-IN')} (Balance: ₹0)
          </div>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors w-full"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Payment Confirmation View
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-slate-50 to-slate-100 py-10 px-4 flex flex-col items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 border border-slate-100 text-center relative overflow-hidden">
          {/* Decorative Confetti Banner */}
          <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-indigo-500 to-teal-400" />

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 size={36} className="text-emerald-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
            <Sparkles size={13} />
            Payment Verified & Recorded
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-1">Payment Successful!</h2>
          <p className="text-sm text-slate-500 mb-6">
            Thank you for your payment to <span className="font-semibold text-slate-800">{data.businessName}</span>
          </p>

          {/* Receipt Breakdown Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3 mb-6">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
              <span className="text-xs text-slate-500">Receipt Number</span>
              <span className="text-xs font-mono font-bold text-indigo-700">{paymentSuccess.receiptNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
              <span className="text-xs text-slate-500">Invoice Number</span>
              <span className="text-xs font-bold text-slate-800">#{data.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
              <span className="text-xs text-slate-500">Transaction ID</span>
              <span className="text-xs font-mono text-slate-600">{paymentSuccess.paymentId}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
              <span className="text-xs text-slate-500">Payment Method</span>
              <span className="text-xs font-semibold text-slate-700">{paymentSuccess.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200/80">
              <span className="text-xs text-slate-500">Paid Amount</span>
              <span className="text-base font-extrabold text-emerald-600">
                ₹{paymentSuccess.amountPaid.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-slate-500">Remaining Balance</span>
              <span className={`text-xs font-bold ${paymentSuccess.balanceRemaining <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {paymentSuccess.balanceRemaining <= 0 ? 'Settled in Full (₹0)' : `₹${paymentSuccess.balanceRemaining.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Printer size={16} />
              Print Receipt
            </button>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const effectiveAmount = getEffectiveAmount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f6ff] via-[#f9faff] to-slate-50 text-slate-800 py-6 sm:py-12 px-4 flex flex-col justify-between">
      <div className="max-w-2xl w-full mx-auto">
        {/* Top Header / Branding */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CollectIQLogo size={36} />
            <div>
              <div className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Secure Payment Gateway</div>
              <h1 className="text-lg font-bold text-slate-900">{data.businessName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
            <Lock size={12} />
            <span>256-Bit SSL</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden">
          {/* Card Top Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 sm:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 text-xs font-medium tracking-wide uppercase mb-2">
                  Invoice #{data.invoiceNumber}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  ₹{data.balance.toLocaleString('en-IN')}
                </h2>
                <p className="text-xs text-indigo-100 mt-1">Outstanding Balance Due</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:text-right border border-white/15">
                <div className="text-xs text-indigo-200 flex items-center sm:justify-end gap-1.5 mb-1">
                  <Calendar size={13} />
                  Due Date
                </div>
                <div className="text-sm font-semibold">{data.dueDate || 'Upon Receipt'}</div>
                <div className="text-xs text-indigo-200/80 mt-1">Total Billed: ₹{data.amount.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Customer & Business Info Pill */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Billed To</div>
                  <div className="text-sm font-bold text-slate-800">{data.customerName}</div>
                  <div className="text-xs text-slate-500">{data.customerEmail}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Payable To</div>
                  <div className="text-sm font-bold text-slate-800">{data.businessName}</div>
                  <div className="text-xs text-slate-500">Verified Merchant Account</div>
                </div>
              </div>
            </div>

            {/* Line Items Accordion / Summary */}
            {data.items && data.items.length > 0 && (
              <div className="border border-slate-100 rounded-2xl p-4 bg-white">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Itemized Breakdown</div>
                <div className="divide-y divide-slate-100 text-xs">
                  {data.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-slate-800">{item.description}</span>
                        <span className="text-slate-400 ml-2">× {item.quantity}</span>
                      </div>
                      <div className="font-medium text-slate-700">₹{(item.total || item.unitPrice * item.quantity).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Partial Payment Toggle */}
            {data.allowPartialPayments && data.balance > (data.minPartialAmount || 500) && (
              <div className="border border-indigo-100 bg-indigo-50/30 rounded-2xl p-4">
                <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">Payment Amount Option</div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('full');
                      setAmountError(null);
                    }}
                    className={`py-3 px-4 rounded-xl text-left border transition-all ${
                      paymentType === 'full'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs text-slate-500">Pay Full Balance</div>
                    <div className="text-base font-extrabold">₹{data.balance.toLocaleString('en-IN')}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentType('partial');
                      setAmountError(null);
                    }}
                    className={`py-3 px-4 rounded-xl text-left border transition-all ${
                      paymentType === 'partial'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs text-slate-500">Custom Partial Amount</div>
                    <div className="text-sm font-semibold">Min: ₹{data.minPartialAmount?.toLocaleString('en-IN') || '500'}</div>
                  </button>
                </div>

                {paymentType === 'partial' && (
                  <div className="mt-3 pt-3 border-t border-indigo-100">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Enter Payment Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                      <input
                        type="number"
                        min={data.minPartialAmount || 500}
                        max={data.balance}
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        placeholder={`Min ${data.minPartialAmount || 500}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Amount Error */}
            {amountError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{amountError}</span>
              </div>
            )}

            {/* Supported Payment Methods Badges */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Supported Instant Payment Modes
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1">
                  <Smartphone size={18} className="text-indigo-600" />
                  <span className="text-[11px] font-semibold text-slate-700">UPI / QR</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1">
                  <CreditCard size={18} className="text-indigo-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Cards</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1">
                  <Building2 size={18} className="text-indigo-600" />
                  <span className="text-[11px] font-semibold text-slate-700">NetBanking</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-1 col-span-3 sm:col-span-1">
                  <ShieldCheck size={18} className="text-emerald-600" />
                  <span className="text-[11px] font-semibold text-slate-700">Instant</span>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              disabled={isProcessing || effectiveAmount <= 0 || Boolean(amountError)}
              onClick={handlePayNow}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-base shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Connecting to Gateway...</span>
                </>
              ) : (
                <>
                  <Lock size={18} />
                  <span>Pay ₹{effectiveAmount.toLocaleString('en-IN')} Securely</span>
                </>
              )}
            </button>

            {/* Trust Footer */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" />
                RBI & PCI Compliant
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock size={13} className="text-slate-400" />
                End-to-End Encrypted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Indian Gateway Modal (Active when Razorpay Live Keys not yet injected in env) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <div className="text-xs text-indigo-600 font-bold uppercase">Razorpay Gateway Test Mode</div>
                  <h3 className="text-sm font-bold text-slate-800">Complete Payment</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSimulatedModal(false);
                  setIsProcessing(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-2 mb-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <div className="text-xs text-slate-500">Payable Amount</div>
              <div className="text-2xl font-extrabold text-indigo-900">₹{effectiveAmount.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-slate-400">Invoice #{data.invoiceNumber}</div>
            </div>

            {/* Method Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSimulatedMethod('upi')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  simulatedMethod === 'upi' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                UPI (GPay/PhonePe)
              </button>
              <button
                type="button"
                onClick={() => setSimulatedMethod('card')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  simulatedMethod === 'card' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setSimulatedMethod('netbanking')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  simulatedMethod === 'netbanking' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Net Banking
              </button>
            </div>

            {simulatedMethod === 'upi' && (
              <div className="space-y-3 mb-5">
                <label className="block text-xs font-semibold text-slate-700">Enter UPI ID / VPA</label>
                <input
                  type="text"
                  value={simulatedUpiId}
                  onChange={(e) => setSimulatedUpiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. mobile@upi, name@okhdfcbank"
                />
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Smartphone size={14} className="text-indigo-600" />
                  <span>A collect request will be approved in test mode</span>
                </div>
              </div>
            )}

            {simulatedMethod === 'card' && (
              <div className="space-y-3 mb-5 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800">Test Card (Razorpay Sandbox)</div>
                  <div className="font-mono text-slate-600 mt-1">4111 •••• •••• 1111</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Expires 12/28 • CVV 123</div>
                </div>
              </div>
            )}

            {simulatedMethod === 'netbanking' && (
              <div className="space-y-2 mb-5 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800">HDFC Bank / ICICI / SBI</div>
                  <div className="text-slate-500 mt-0.5">Instant test simulation</div>
                </div>
              </div>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSimulatedSubmit}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying HMAC Signature...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Authorize & Pay ₹{effectiveAmount.toLocaleString('en-IN')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 mt-8">
        Powered by <span className="font-semibold text-slate-600">CollectIQ Smart Payments</span> • Automated Invoice Reconciliation
      </footer>
    </div>
  );
};
