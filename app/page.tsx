'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import anime from 'animejs';
import { Button } from '../components/ui/Button';
import { InteractiveDemo } from '../components/landing/InteractiveDemo';
import { Timeline } from '../components/landing/Timeline';
import { FeatureCards } from '../components/landing/FeatureCards';
import { splitText } from '../hooks/useAnime';
import { BrandLogo } from '../components/ui/BrandLogo';
import { Navbar } from '../components/ui/Navbar';

const LiquidEther = dynamic(() => import('../components/ui/LiquidEther'), { ssr: false });

export default function LandingPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Hero Entrance Animation
    anime.timeline({ easing: 'easeOutExpo' })
      .add({
        targets: '.hero-heading .anime-char',
        translateY: [40, 0],
        translateZ: 0,
        opacity: [0, 1],
        duration: 800,
        delay: anime.stagger(20)
      })
      .add({
        targets: '.hero-sub, .hero-cta',
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
      }, '-=400');
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      
      {/* Liquid WebGL Background */}
      <div className="absolute top-0 inset-x-0 h-[600px] md:h-[750px] z-0 pointer-events-none opacity-40">
        <LiquidEther />
      </div>
      
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="pt-28 md:pt-40 pb-16 md:pb-20 px-4 md:px-6 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs text-secondary mb-8">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
          24/7 WhatsApp Chat Automation & Booking
        </div>
        
        <h1 
          className="hero-heading text-5xl md:text-7xl font-semibold tracking-tighter text-balance mb-6"
          dangerouslySetInnerHTML={{ __html: splitText('Automate Customer Chats & Bookings.') }}
        />
        
        <p className="hero-sub text-lg md:text-xl text-secondary text-balance max-w-2xl mb-10 opacity-0">
          Jawaab AI replies to your WhatsApp messages, handles bookings, and populates your CRM automatically.
        </p>
        
        <div className="hero-cta flex flex-col sm:flex-row items-center gap-4 opacity-0">
          <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push('/demo')}>Book a Demo</Button>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => router.push('/demo')}>Watch Live Demo</Button>
        </div>
      </section>
 
      {/* Centerpiece Interactive Demo */}
      <section className="py-12 border-b border-border bg-gradient-to-b from-transparent to-surface/50">
        <InteractiveDemo />
      </section>
 
      {/* Problem Section (Minimal) */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto border-b border-border">
        <h2 className="text-3xl font-semibold mb-12">Your business is losing leads when you are:</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-secondary">
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="text-primary font-medium mb-2">Busy with a customer</h3>
            <p className="text-sm">You can't answer incoming WhatsApp messages while cutting hair or consulting.</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="text-primary font-medium mb-2">Driving or traveling</h3>
            <p className="text-sm">You are busy on the road, leaving prospective clients waiting for replies.</p>
          </div>
          <div className="p-6 rounded-2xl bg-surface border border-border">
            <h3 className="text-primary font-medium mb-2">After business hours</h3>
            <p className="text-sm">Customers message late at night. Jawaab AI replies instantly and secures the booking.</p>
          </div>
        </div>
      </section>

      {/* How it Works Timeline */}
      <Timeline />

      {/* Features Grid */}
      <section className="border-t border-border bg-surface/30">
        <div className="text-center pt-24 pb-8">
          <h2 className="text-3xl font-semibold mb-4 tracking-tight">Everything a receptionist does.</h2>
          <p className="text-secondary">Without the overhead, training, or sick days.</p>
        </div>
        <FeatureCards />
      </section>

      {/* Trust & Pricing placeholder for brevity */}
      <section className="py-24 px-6 text-center max-w-3xl mx-auto border-t border-border">
        <h2 className="text-4xl font-semibold mb-6">Ready to secure your leads?</h2>
        <p className="text-secondary mb-10">Setup takes 5 minutes. No coding required.</p>
        <Button size="lg" onClick={() => router.push('/login?mode=signup')}>Start Your Free Trial</Button>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border text-center text-xs text-secondary bg-surface/10 space-y-4">
        <div className="flex justify-center gap-6">
          <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="/demo" className="hover:text-white transition-colors">Demo</a>
          <a href="/login" className="hover:text-white transition-colors">Log In</a>
        </div>
        <p>© 2026 Jawaab AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
