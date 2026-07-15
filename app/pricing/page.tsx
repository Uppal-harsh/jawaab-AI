'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Check, ShieldAlert, Zap, Landmark, Globe, Smartphone, Mail, KeyRound, CheckCircle, ArrowRight, X, Loader2 } from 'lucide-react';
import { Navbar } from '../../components/ui/Navbar';

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [region, setRegion] = useState<'IN' | 'US' | 'EU'>('IN');

  const getTierPrice = (tierName: string, period: 'monthly' | 'annual') => {
    if (tierName === 'Starter') {
      if (region === 'IN') return period === 'monthly' ? 799 : 639;
      if (region === 'US') return period === 'monthly' ? 14.99 : 11.99;
      return period === 'monthly' ? 14.99 : 11.99; // EU
    }
    if (tierName === 'Growth') {
      if (region === 'IN') return period === 'monthly' ? 1499 : 1199;
      if (region === 'US') return period === 'monthly' ? 34.99 : 27.99;
      return period === 'monthly' ? 34.99 : 27.99; // EU
    }
    return null; // Enterprise
  };

  const getCurrencySymbol = () => {
    if (region === 'IN') return '₹';
    if (region === 'US') return '$';
    return '€';
  };

  // Multi-step trial signup states
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('+91');
  const [otpInput, setOtpInput] = useState('');

  // OTP/Verification status states
  const [resendTimer, setResendTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [verificationSuccessData, setVerificationSuccessData] = useState<{ trialExpiresAt: string } | null>(null);

  // Auto-decrement timer for Resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showSignupModal && currentStep === 3 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showSignupModal, currentStep, resendTimer]);

  const isBusinessEmail = (email: string): boolean => {
    const freeDomains = [
      'gmail.com',
      'yahoo.com',
      'yahoo.co.in',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'aol.com',
      'mail.com',
      'protonmail.com',
      'proton.me',
      'yandex.com',
      'gmx.com',
      'gmx.net',
      'live.com'
    ];
    const parts = email.split('@');
    if (parts.length < 2) return false;
    const domain = parts[1].toLowerCase().trim();
    return !freeDomains.includes(domain);
  };

  const handleStep1Email = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setModalError('Please enter a valid email address.');
      return;
    }
    if (!isBusinessEmail(emailInput)) {
      setModalError('Please enter a business email address (free consumer domains like @gmail.com or @yahoo.com are not permitted).');
      return;
    }
    setModalError(null);
    setCurrentStep(2);
  };

  const handleStep2Phone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || phoneInput.length < 10 || !phoneInput.startsWith('+')) {
      setModalError('Enter a valid phone number with country code (e.g. +919876543210).');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, email: emailInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch verification OTP.');
      }

      // Display simulated code in console / dialog alert if Twilio credentials are not set up
      if (data.simulated && data.debugCode) {
        console.warn(`[DEVELOPMENT DEBUG] OTP code sent to ${phoneInput}: ${data.debugCode}`);
        alert(`[DEV MODE] Twilio mock OTP is: ${data.debugCode} (Enter this in the next step).`);
      }

      setResendTimer(30);
      setCurrentStep(3);
    } catch (err: any) {
      setModalError(err.message || 'OTP dispatch failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.length !== 6) {
      setModalError('Verification code must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, code: otpInput }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      // Store trial parameters locally for warning countdowns
      localStorage.setItem('trial_active', 'true');
      localStorage.setItem('trial_expiry', data.trialExpiresAt);
      localStorage.setItem('verified_phone', phoneInput);

      setVerificationSuccessData(data);
      setCurrentStep(4);
    } catch (err: any) {
      setModalError(err.message || 'Incorrect verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsSubmitting(true);
    setModalError(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, email: emailInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.simulated && data.debugCode) {
        alert(`[DEV MODE] Resent mock OTP is: ${data.debugCode}`);
      }

      setResendTimer(30);
    } catch (err: any) {
      setModalError(err.message || 'Failed to resend OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModalState = () => {
    setShowSignupModal(false);
    setCurrentStep(1);
    setEmailInput('');
    setPhoneInput('+91');
    setOtpInput('');
    setModalError(null);
    setVerificationSuccessData(null);
  };

  // Multi-tier price structure
  const tiers = [
    {
      name: 'Starter',
      description: 'Ideal for neighborhood local storefronts & single-owner shops.',
      monthlyPrice: 799,
      annualPrice: 639,
      trialText: '₹0 to start',
      features: [
        '7-day free trial (no credit card)',
        'Up to 500 WhatsApp AI responses/month',
        'Basic lead capture from WhatsApp',
        'Single integration (Google Calendar)',
        'Email support (24-48hr response)',
        'Phone verification required',
      ],
      icon: <Globe className="w-5 h-5 text-secondary" />,
      highlight: false,
    },
    {
      name: 'Growth',
      description: 'Best for busy salons, clinic groups, and growing service centers.',
      monthlyPrice: 1499,
      annualPrice: 1199,
      features: [
        'Unlimited WhatsApp AI responses',
        'Advanced lead qualification with AI scoring',
        'Full graphical dashboard & analytics',
        'Multi-integrations (Calendar, Gmail, Sheets, Jira)',
        'Suggested AI responses on dashboard',
        'Priority chat support',
        'Lead tracking & history',
      ],
      icon: <Zap className="w-5 h-5 text-accent" />,
      highlight: true,
    },
    {
      name: 'Enterprise',
      description: 'For corporate scale centers and multi-location businesses.',
      priceText: 'Custom',
      features: [
        'Everything in Growth +',
        'Unlimited parallel WhatsApp channels',
        'Custom fine-tuned AI agents',
        'Multi-location support',
        'Advanced Exotel channel integration',
        'Dedicated account manager',
        'Custom API access & SLAs',
      ],
      icon: <Landmark className="w-5 h-5 text-secondary" />,
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      <Navbar />

      <main className="pt-28 pb-20 px-4 max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-4 font-syne text-white">
            Transparent Pricing.
          </h1>
          <p className="text-secondary text-sm md:text-base">
            Choose a plan that fits your business goals. Start risk-free with our 7-day free trial.
          </p>
        </div>

        {/* Toggles (Billing Period & Region Selector) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-12">
          {/* Billing Period Toggle */}
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-full border border-border">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                billingPeriod === 'monthly' ? 'bg-white text-black font-bold' : 'text-secondary hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                billingPeriod === 'annual' ? 'bg-white text-black font-bold' : 'text-secondary hover:text-white'
              }`}
            >
              Annual Billing
              <span className="text-[9px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">Save 20%</span>
            </button>
          </div>

          {/* Region / Currency selector */}
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-full border border-border">
            <button
              onClick={() => setRegion('IN')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                region === 'IN' ? 'bg-white text-black font-bold' : 'text-secondary hover:text-white'
              }`}
            >
              🇮🇳 India (₹)
            </button>
            <button
              onClick={() => setRegion('US')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                region === 'US' ? 'bg-white text-black font-bold' : 'text-secondary hover:text-white'
              }`}
            >
              🇺🇸 Outside India - US ($)
            </button>
            <button
              onClick={() => setRegion('EU')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                region === 'EU' ? 'bg-white text-black font-bold' : 'text-secondary hover:text-white'
              }`}
            >
              🇪🇺 Outside India - Europe (€)
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
          {tiers.map((tier, idx) => {
            const price = getTierPrice(tier.name, billingPeriod);
            const currencySymbol = getCurrencySymbol();
            let priceFormatted = tier.priceText;
            if (price !== null) {
              if (region === 'IN') {
                priceFormatted = `${currencySymbol}${price.toLocaleString('en-IN')}`;
              } else {
                priceFormatted = `${currencySymbol}${price.toFixed(2)}`;
              }
            }
            const isCustom = price === null;

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-6 md:p-8 flex flex-col relative transition-all duration-300 hover:-translate-y-1 ${
                  tier.highlight
                    ? 'bg-surface border-accent shadow-[0_0_30px_rgba(214,255,0,0.05)]'
                    : 'bg-surface/50 border-border hover:border-white/20'
                }`}
              >
                {tier.highlight && (
                  <span className="absolute top-4 right-4 bg-accent/15 text-accent text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
                    Most Popular
                  </span>
                )}

                {tier.trialText && (
                  <span className="absolute top-4 right-4 bg-green-500/15 text-green-400 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full">
                    {tier.trialText}
                  </span>
                )}

                {/* Card Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-background border border-border rounded-xl">
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white font-syne">{tier.name}</h3>
                </div>

                <p className="text-secondary text-xs leading-relaxed mb-6 min-h-[36px]">{tier.description}</p>

                {/* Card Pricing */}
                <div className="mb-6 flex items-baseline gap-1.5 border-b border-border pb-6">
                  <span className="text-3xl md:text-4xl font-bold tracking-tight text-white font-syne">
                    {priceFormatted}
                  </span>
                  {!isCustom && (
                    <span className="text-xs text-secondary">
                      / month {billingPeriod === 'annual' && 'billed annually'}
                    </span>
                  )}
                </div>

                {/* Feature List */}
                <ul className="space-y-3.5 mb-8 flex-1">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-secondary">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <Button
                  className="w-full justify-center text-sm font-semibold h-11"
                  variant={tier.highlight ? 'primary' : 'secondary'}
                  onClick={() => {
                    if (isCustom) {
                      window.location.href = 'mailto:sales@jawab.ai';
                    } else {
                      setShowSignupModal(true);
                    }
                  }}
                >
                  {isCustom ? 'Contact Sales' : 'Start 7-Day Free Trial'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Safety Note */}
        <div className="mt-12 bg-surface border border-border rounded-xl p-5 flex items-center gap-3.5 max-w-xl text-center md:text-left flex-col md:flex-row">
          <Smartphone className="w-6 h-6 text-accent shrink-0" />
          <div className="text-xs text-secondary leading-relaxed">
            <p className="font-semibold text-white mb-0.5">Phone Verification Required</p>
            <p className="text-[11px]">No credit card required. Limit 2-3 trials per phone number to restrict abuse. Active WhatsApp message volume scales dynamically according to verified database thresholds.</p>
          </div>
        </div>

      </main>

      {/* 4-Step Trial Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 animate-in scale-in duration-300">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white font-syne">Jawaab Trial Activation</h3>
                <p className="text-xs text-secondary">Step {currentStep} of 4</p>
              </div>
              <button 
                onClick={resetModalState}
                className="text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                {modalError}
              </div>
            )}

            {/* STEP 1: Email Address */}
            {currentStep === 1 && (
              <form onSubmit={handleStep1Email} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Business Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input 
                      type="email"
                      required
                      placeholder="owner@yourclinic.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-secondary">We will use this address to deliver lead export sheets and alert reports.</p>
                <Button type="submit" className="w-full justify-center h-10 gap-2 font-bold">
                  Next Step <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            {/* STEP 2: Phone Input */}
            {currentStep === 2 && (
              <form onSubmit={handleStep2Phone} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">WhatsApp Phone Number</label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input 
                      type="tel"
                      required
                      placeholder="+919876543210"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white font-mono"
                    />
                  </div>
                </div>
                <div className="text-[10px] text-secondary space-y-1 bg-background/50 p-2.5 rounded-lg border border-border/40">
                  <p>• Max limit of 2-3 free trials allowed per phone number.</p>
                  <p>• Make sure to prefix with your country code (e.g. +91 for India).</p>
                </div>
                <Button type="submit" className="w-full justify-center h-10 gap-2 font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP Verification'}
                </Button>
              </form>
            )}

            {/* STEP 3: OTP Verification Entry */}
            {currentStep === 3 && (
              <form onSubmit={handleStep3Verify} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">6-Digit Verification Code</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input 
                      type="text"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white tracking-[0.4em] font-mono text-center font-bold text-lg"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[10px] text-secondary">Check your phone SMS messages for the code.</p>
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || isSubmitting}
                    className={`text-[10px] font-bold ${
                      resendTimer > 0 ? 'text-secondary cursor-not-allowed' : 'text-accent hover:underline'
                    }`}
                  >
                    {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : 'Resend Code'}
                  </button>
                </div>

                <Button type="submit" className="w-full justify-center h-10 gap-2 font-bold" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Activate Trial'}
                </Button>
              </form>
            )}

            {/* STEP 4: Success Access Granted */}
            {currentStep === 4 && (
              <div className="space-y-6 text-center py-4">
                <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-white text-md font-syne">7-Day Free Trial Activated</h4>
                  <p className="text-xs text-secondary">Your trial has been registered for phone {phoneInput}.</p>
                </div>

                <div className="bg-background border border-border/80 p-4 rounded-xl space-y-2">
                  <p className="text-[10px] text-secondary uppercase font-bold tracking-wider">Time Remaining</p>
                  <p className="text-xl font-bold text-accent font-syne">7 Days 00:00:00</p>
                  <p className="text-[9px] text-secondary">Expiry Date: {new Date(verificationSuccessData?.trialExpiresAt || '').toLocaleDateString()}</p>
                </div>

                <Button 
                  onClick={() => {
                    resetModalState();
                    router.push('/onboarding');
                  }} 
                  className="w-full justify-center h-10 gap-2 font-bold"
                >
                  Proceed to Onboarding Setup <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

      <footer className="py-6 border-t border-border text-center text-xs text-secondary bg-background/50">
        <p>© 2026 Jawaab AI. All rights reserved.</p>
      </footer>

    </div>
  );
}
