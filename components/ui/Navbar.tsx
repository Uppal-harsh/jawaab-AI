'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BrandLogo } from './BrandLogo';
import { Button } from './Button';
import { X, CheckCircle, Flame, Shield, HelpCircle, PhoneCall } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleStartTrial = () => {
    setIsOpen(false);
    router.push('/login?mode=signup');
  };

  return (
    <>
      <nav className="fixed top-0 inset-x-0 h-16 border-b border-border bg-background/80 backdrop-blur-md z-50 grid grid-cols-3 items-center px-4 md:px-12">
        {/* Left Links */}
        <div className="flex items-center gap-4 md:gap-6 justify-start">
          <a 
            href="/pricing" 
            className={`text-xs md:text-sm font-medium transition-colors ${
              pathname === '/pricing' ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            Pricing
          </a>
          <a 
            href="/faq" 
            className={`text-xs md:text-sm font-medium transition-colors ${
              pathname === '/faq' ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            FAQ
          </a>
          <a 
            href="/demo" 
            className={`text-xs md:text-sm font-medium transition-colors ${
              pathname === '/demo' ? 'text-primary' : 'text-secondary hover:text-primary'
            }`}
          >
            Watch Demo
          </a>
        </div>
        
        {/* Center Logo */}
        <div className="flex justify-center">
          <a href="/">
            <BrandLogo size="sm" />
          </a>
        </div>
        
        {/* Right CTA */}
        <div className="flex items-center gap-3 md:gap-5 justify-end">
          <a href="/login" className="text-xs md:text-sm font-medium text-secondary hover:text-primary transition-colors">Log in</a>
          <Button 
            size="sm" 
            className="text-xs px-3 py-1.5 md:px-4 md:py-2 font-bold bg-accent text-background hover:bg-accent/80 border border-accent/20" 
            onClick={() => setIsOpen(true)}
          >
            Try free
          </Button>
        </div>
      </nav>

      {/* Free Trial Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 md:p-8 animate-in scale-in duration-300 space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/10 text-accent border border-accent/25">
                  <Flame className="w-3 h-3 text-accent" /> 14-day trial
                </div>
                <h3 className="text-xl font-bold text-white font-syne mt-2">What you get with Try Free</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trial Stats & Features Grid */}
            <div className="space-y-4">
              <div className="flex gap-3.5 p-3 rounded-xl bg-background/50 border border-border">
                <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white">50 Incoming Calls Included</h4>
                  <p className="text-[11px] text-secondary">Free temporary SIP routing line activated immediately.</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3 rounded-xl bg-background/50 border border-border">
                <PhoneCall className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white">24/7 AI Voice Receptionist</h4>
                  <p className="text-[11px] text-secondary">Answers natural Hinglish, Hindi, and English customer queries.</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3 rounded-xl bg-background/50 border border-border">
                <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white">Instant WhatsApp Lead Summaries</h4>
                  <p className="text-[11px] text-secondary">Captured names, numbers, and call logs sent straight to WhatsApp.</p>
                </div>
              </div>

              <div className="flex gap-3.5 p-3 rounded-xl bg-background/50 border border-border">
                <HelpCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-white">No Credit Card Required</h4>
                  <p className="text-[11px] text-secondary">No contract lock-ins. Cancel anytime under 5-minute setup.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                onClick={handleStartTrial}
                className="w-full justify-center h-11 text-sm font-bold bg-accent text-background hover:bg-accent/80 border border-accent/20"
              >
                Start My Free Trial
              </Button>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 text-center text-xs font-semibold text-secondary hover:text-white transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
