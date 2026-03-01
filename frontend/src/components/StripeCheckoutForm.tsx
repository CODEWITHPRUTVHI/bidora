'use client';

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import api from '@/lib/axios';
import { Lock, CheckCircle2 } from 'lucide-react';

interface Props {
    clientSecret: string;
    onSuccess: () => void;
    onCancel: () => void;
    amount?: number;
}

export default function StripeCheckoutForm({ clientSecret, onSuccess, onCancel, amount }: Props) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [done, setDone] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setErrorMessage('');

        // Submit elements first (validates the form)
        const { error: submitError } = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message || 'Please check your card details.');
            setLoading(false);
            return;
        }

        // Confirm payment — use redirect: 'if_required' + a valid return_url
        // We use the current origin so it works on both localhost and mobile network IPs
        const returnUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/dashboard?tab=wallet&deposit=success`
            : 'http://localhost:3000/dashboard?tab=wallet&deposit=success';

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            clientSecret,
            confirmParams: { return_url: returnUrl },
            redirect: 'if_required',
        });

        if (error) {
            // Card errors, validation errors
            setErrorMessage(error.message || 'Payment failed. Please try again.');
            setLoading(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            try {
                await api.post('/payments/verify', { paymentIntentId: paymentIntent.id });
                setDone(true);
                setTimeout(() => onSuccess(), 1200);
            } catch (err: any) {
                setErrorMessage(
                    err.response?.data?.error ||
                    'Payment went through but wallet top-up failed. Contact support.'
                );
                setLoading(false);
            }
            return;
        }

        if (paymentIntent?.status === 'requires_action') {
            setErrorMessage('Additional authentication required. Please complete the 3D Secure step.');
            setLoading(false);
            return;
        }

        setErrorMessage(`Unexpected status: ${paymentIntent?.status || 'unknown'}. Please try again.`);
        setLoading(false);
    };

    // ── Success state ─────────────────────────────────────────────────
    if (done) {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-white font-black text-xl">Payment Successful!</p>
                {amount && <p className="text-gray-400 text-sm">₹{amount.toLocaleString('en-IN')} added to your wallet.</p>}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Secure badge */}
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                <Lock className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span>256-bit SSL encrypted · Powered by Stripe · PCI DSS compliant</span>
            </div>

            {/* Stripe Payment Element */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
                <PaymentElement
                    options={{
                        layout: 'tabs',
                        wallets: { applePay: 'never', googlePay: 'never' },
                    }}
                />
            </div>

            {/* Error */}
            {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
                    {errorMessage}
                </div>
            )}

            {/* Test card hint */}
            <div className="text-xs text-gray-600 bg-white/3 border border-white/5 rounded-xl px-3 py-2 space-y-0.5">
                <p className="font-semibold text-gray-500">🧪 Test Mode — Use these details:</p>
                <p>Card: <span className="text-gray-400 font-mono">4242 4242 4242 4242</span></p>
                <p>Expiry: <span className="text-gray-400 font-mono">12/29</span> &nbsp; CVV: <span className="text-gray-400 font-mono">123</span></p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 px-4 py-3 border border-white/20 rounded-xl text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={!stripe || !elements || loading}
                    className="flex-1 px-4 py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-300 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 text-sm"
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            Processing…
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" />
                            {amount ? `Pay ₹${amount.toLocaleString('en-IN')}` : 'Pay Now'}
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
