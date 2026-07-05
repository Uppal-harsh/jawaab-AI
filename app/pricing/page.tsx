'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Check, ShieldAlert, Zap, Landmark, Globe } from 'lucide-react';
import { Navbar } from '../../components/ui/Navbar';

export default function PricingPage() {
  const router = useRouter();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  // Multi-tier price structure
  const tiers = [
    {
      name: 'Starter',
      description: 'Ideal for neighborhood local storefronts & single-owner shops.',
      monthlyPrice: 1499,
      annualPrice: 1199,
      features: [
        '50 AI answered calls per month',
        '24/7 coverage (Timings & FAQ)',
        'Basic English voice agent',
        'Instant WhatsApp call summaries',
        'Lead names & numbers captured',
        'Email customer support',
      ],
      icon: <Globe className="w-5 h-5 text-secondary" />,
      highlight: false,
    },
    {
      name: 'Growth',
      description: 'Best for dental clinics, consultancies, and busy service owners.',
      monthlyPrice: 4999,
      annualPrice: 3999,
      features: [
        '500 AI answered calls per month',
        'Hinglish & Native Hindi voice support',
        'Custom greeting messages',
        'Interactive callback triggers',
        'Priority database queue',
        'Advanced Exotel channel integration',
        'WhatsApp & SMS alert configs',
        'Priority email/phone support',
      ],
      icon: <Zap className="w-5 h-5 text-accent" />,
      highlight: true,
    },
    {
      name: 'Enterprise',
      description: 'For corporate scale call centers and multi-location businesses.',
      priceText: 'Custom',
      features: [
        'Unlimited parallel calling channels',
        'Custom fine-tuned LLM agents',
        'Multi-number Exotel configuration',
        'Full REST API lead webhook exports',
        'Custom CRM contact sync integrations',
        'Dedicated account representative',
        '99.9% voice gateway SLA guarantees',
      ],
      icon: <Landmark className="w-5 h-5 text-secondary" />,
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      
      {/* Decorative Blur Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[20%] left-[-10%] w-[45%] h-[45%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(255,255,255,0.01)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="pt-28 pb-20 px-4 max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mb-12">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-4 font-syne text-white">
            Transparent Pricing.
          </h1>
          <p className="text-secondary text-sm md:text-base text-balance">
            Choose a plan that matches your monthly call volumes. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-4 mb-12 bg-surface p-1.5 rounded-full border border-border">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              billingPeriod === 'monthly'
                ? 'bg-white text-black'
                : 'text-secondary hover:text-white'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
              billingPeriod === 'annual'
                ? 'bg-white text-black'
                : 'text-secondary hover:text-white'
            }`}
          >
            Annual Billing
            <span className="text-[9px] bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full">
          {tiers.map((tier, idx) => {
            const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const priceFormatted = price ? `₹${price.toLocaleString('en-IN')}` : tier.priceText;
            const isCustom = !price;

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

                {/* Card Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-background border border-border rounded-xl">
                    {tier.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white font-syne">{tier.name}</h3>
                </div>

                {/* Card Description */}
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
                      router.push('/login?mode=signup');
                    }
                  }}
                >
                  {isCustom ? 'Contact Sales' : 'Start 14-Day Free Trial'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Safety Note */}
        <div className="mt-12 bg-surface border border-border rounded-xl p-4 flex items-center gap-3.5 max-w-xl text-center md:text-left flex-col md:flex-row">
          <ShieldAlert className="w-5 h-5 text-accent shrink-0" />
          <p className="text-[11px] text-secondary leading-relaxed">
            All prices subject to actual telephony usage costs. Exotel carrier call minutes are billed separately at standard rates. Free trial includes 10 free AI conversation test minutes.
          </p>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-xs text-secondary bg-background/50">
        <p>© 2026 Jawab AI. All rights reserved.</p>
      </footer>

    </div>
  );
}
