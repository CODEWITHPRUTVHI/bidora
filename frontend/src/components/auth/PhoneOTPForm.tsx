'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/store/AuthContext';
import api from '@/lib/axios';

const COUNTRY_CODES = [
    { code: '+91', flag: '🇮🇳', name: 'IN' },
    { code: '+1', flag: '🇺🇸', name: 'US' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+65', flag: '🇸🇬', name: 'SG' },
    { code: '+60', flag: '🇲🇾', name: 'MY' },
    { code: '+880', flag: '🇧🇩', name: 'BD' },
];

const ERROR_MAP: Record<string, string> = {
    'auth/invalid-phone-number': 'Please enter a valid phone number.',
    'auth/too-many-requests': 'Too many attempts. Please wait 5 minutes.',
    'auth/quota-exceeded': 'Too many attempts. Please wait 5 minutes.',
    'auth/code-expired': 'OTP expired. Please request a new one.',
    'auth/invalid-verification-code': 'Incorrect OTP. Please check and retry.',
    'auth/network-request-failed': 'Connection failed. Check your internet.',
};

function getFirebaseError(code: string): string {
    return ERROR_MAP[code] || 'Something went wrong. Please try again.';
}

interface PhoneOTPFormProps {
    onError?: (msg: string) => void;
}

export default function PhoneOTPForm({ onError }: PhoneOTPFormProps) {
    // Step state
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [countryCode, setCountryCode] = useState('+91');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [fullPhone, setFullPhone] = useState('');

    // UI state
    const [sendingOtp, setSendingOtp] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(0);

    // Refs
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const { login } = useAuth();
    const router = useRouter();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            recaptchaVerifierRef.current?.clear();
        };
    }, []);

    // Auto-focus first OTP box when entering OTP step
    useEffect(() => {
        if (step === 'otp') {
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
    }, [step]);

    // Countdown timer
    const startCountdown = useCallback(() => {
        setCountdown(60);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    const setupRecaptcha = useCallback(() => {
        // Clear any previous verifier
        if (recaptchaVerifierRef.current) {
            try { recaptchaVerifierRef.current.clear(); } catch { }
            recaptchaVerifierRef.current = null;
        }
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => { },
        });
        return recaptchaVerifierRef.current;
    }, []);

    const handleSendOTP = async () => {
        setError('');
        const cleaned = phoneNumber.replace(/\D/g, '');
        if (!cleaned || cleaned.length < 6) {
            setError('Please enter a valid phone number.');
            return;
        }

        const phone = `${countryCode}${cleaned}`;
        setSendingOtp(true);

        try {
            const verifier = setupRecaptcha();
            const result = await signInWithPhoneNumber(auth, phone, verifier);
            setConfirmationResult(result);
            setFullPhone(phone);
            setStep('otp');
            startCountdown();
        } catch (err: any) {
            const msg = getFirebaseError(err.code);
            setError(msg);
            onError?.(msg);
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
        } finally {
            setSendingOtp(false);
        }
    };

    const handleVerifyOTP = useCallback(async (otpValue: string) => {
        if (!confirmationResult || otpValue.length !== 6) return;
        setVerifying(true);
        setError('');

        try {
            const result = await confirmationResult.confirm(otpValue);
            const idToken = await result.user.getIdToken();

            // Server-side verify + find/create user in Railway DB
            const res = await api.post('/auth/phone', { idToken });

            // Store JWT exactly the same way as email/password login
            login(res.data.accessToken, res.data.user);
            router.push('/dashboard');
        } catch (err: any) {
            const msg = err.code ? getFirebaseError(err.code) : (err.response?.data?.error || 'Verification failed. Please try again.');
            setError(msg);
            onError?.(msg);
        } finally {
            setVerifying(false);
        }
    }, [confirmationResult, login, router, onError]);

    // Handle OTP box input
    const handleOtpChange = (index: number, value: string) => {
        // Handle paste
        if (value.length > 1) {
            const digits = value.replace(/\D/g, '').slice(0, 6);
            const newOtp = ['', '', '', '', '', ''];
            digits.split('').forEach((d, i) => { newOtp[i] = d; });
            setOtp(newOtp);
            const nextEmpty = digits.length < 6 ? digits.length : 5;
            otpRefs.current[nextEmpty]?.focus();
            if (digits.length === 6) {
                setTimeout(() => handleVerifyOTP(digits), 50);
            }
            return;
        }

        const digit = value.replace(/\D/g, '');
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        const full = newOtp.join('');
        if (full.length === 6 && newOtp.every(d => d !== '')) {
            setTimeout(() => handleVerifyOTP(full), 50);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                otpRefs.current[index - 1]?.focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        }
    };

    const handleResendOTP = async () => {
        setOtp(['', '', '', '', '', '']);
        setError('');
        setSendingOtp(true);
        try {
            const verifier = setupRecaptcha();
            const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
            setConfirmationResult(result);
            startCountdown();
            otpRefs.current[0]?.focus();
        } catch (err: any) {
            const msg = getFirebaseError(err.code);
            setError(msg);
        } finally {
            setSendingOtp(false);
        }
    };

    // ── PHONE ENTRY STEP ──
    if (step === 'phone') {
        return (
            <div className="space-y-4">
                <div className="flex gap-2">
                    {/* Country code */}
                    <select
                        value={countryCode}
                        onChange={e => setCountryCode(e.target.value)}
                        className="bg-zinc-950/60 border border-white/10 text-white rounded-xl px-3 py-3.5 focus:outline-none focus:border-yellow-400/50 transition-all text-sm flex-shrink-0"
                    >
                        {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                    </select>
                    {/* Phone number */}
                    <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Phone number"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 15))}
                        onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                        className="flex-1 bg-zinc-950/60 border border-white/10 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-yellow-400/50 transition-all placeholder:text-gray-500"
                    />
                </div>

                {error && (
                    <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
                )}

                <button
                    type="button"
                    onClick={handleSendOTP}
                    disabled={sendingOtp || !phoneNumber}
                    className="w-full bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 font-black py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-yellow-300"
                >
                    {sendingOtp ? (
                        <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> Sending…</>
                    ) : '📱 Send OTP'}
                </button>

                {/* Invisible reCAPTCHA */}
                <div id="recaptcha-container" />
            </div>
        );
    }

    // ── OTP ENTRY STEP ──
    return (
        <div className="space-y-5">
            <div className="text-center">
                <p className="text-gray-400 text-sm">OTP sent to <span className="text-white font-semibold">{fullPhone}</span></p>
            </div>

            {/* 6 OTP boxes */}
            <div className="flex justify-center gap-2">
                {otp.map((digit, index) => (
                    <input
                        key={index}
                        ref={el => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={digit}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        onFocus={e => e.target.select()}
                        disabled={verifying}
                        className="w-11 h-12 bg-zinc-950/60 border border-white/10 text-white text-center text-xl font-bold rounded-xl focus:outline-none focus:border-yellow-400 focus:bg-zinc-900 transition-all disabled:opacity-50 caret-transparent"
                    />
                ))}
            </div>

            {verifying && (
                <p className="text-center text-yellow-400 text-sm flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    Verifying…
                </p>
            )}

            {error && (
                <p className="text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
            )}

            {/* Resend */}
            <div className="text-center text-sm">
                {countdown > 0 ? (
                    <p className="text-gray-500">Resend in <span className="text-yellow-400 font-bold">{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span></p>
                ) : (
                    <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={sendingOtp}
                        className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors disabled:opacity-50"
                    >
                        {sendingOtp ? 'Sending…' : 'Resend OTP'}
                    </button>
                )}
            </div>

            {/* Change number */}
            <button
                type="button"
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(''); }}
                className="w-full text-gray-500 hover:text-gray-300 text-sm transition-colors flex items-center justify-center gap-1"
            >
                ← Change number
            </button>

            {/* Invisible reCAPTCHA */}
            <div id="recaptcha-container" />
        </div>
    );
}
