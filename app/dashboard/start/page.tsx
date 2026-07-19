'use client';

import React from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  Key, 
  ArrowRight,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import Link from 'next/link';

export default function HowToStart() {
  const steps = [
    {
      number: '1',
      title: 'Configure your Business Profile',
      description: 'Fill in your business details, operating hours, and greeting message so your AI knows exactly how to represent you.',
      icon: <MessageSquare className="w-5 h-5 text-accent" />,
      actionLabel: 'Go to Business Profile',
      actionHref: '/dashboard/businesses'
    },
    {
      number: '2',
      title: 'Integrate Google Calendar',
      description: 'Set your Google Calendar ID in Settings to allow conflict-free real-time booking synchronization.',
      icon: <Calendar className="w-5 h-5 text-accent" />,
      actionLabel: 'Setup Calendar Sync',
      actionHref: '/dashboard/settings'
    },
    {
      number: '3',
      title: 'Configure WhatsApp Webhook',
      description: 'Connect Meta WhatsApp Business Cloud API. Copy your webhook url and verify token to your Meta dashboard.',
      icon: <LinkIcon className="w-5 h-5 text-accent" />,
      actionLabel: 'View Credentials Settings',
      actionHref: '/dashboard/settings'
    },
    {
      number: '4',
      title: 'Verify Live Automation',
      description: 'Send a test WhatsApp message to your connected number and watch the CRM console qualify the lead and sync bookings instantly.',
      icon: <PlayCircle className="w-5 h-5 text-accent" />,
      actionLabel: 'Open CRM Console',
      actionHref: '/dashboard/calls'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="border-b border-border pb-6">
        <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Quick Start Guide</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white font-syne mb-2">How to Start Using Jawaab AI</h1>
        <p className="text-secondary text-sm max-w-2xl">
          Follow this 4-step checklist to configure, test, and activate your automated 24/7 WhatsApp receptionist.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Steps */}
        <div className="lg:col-span-2 space-y-6">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="bg-surface/50 border border-border/80 hover:border-white/20 transition-all duration-300 rounded-xl p-5 md:p-6 flex items-start gap-4 md:gap-5 group relative"
            >
              {/* Step counter badge */}
              <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent font-syne text-sm shrink-0">
                {step.number}
              </div>

              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  {step.icon}
                  <h3 className="font-semibold text-white font-syne text-base md:text-lg">{step.title}</h3>
                </div>
                <p className="text-secondary text-xs md:text-sm leading-relaxed max-w-xl">{step.description}</p>
                <div className="pt-1">
                  <Link href={step.actionHref}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1.5 text-xs text-accent hover:text-white px-0 hover:bg-transparent font-bold group-hover:translate-x-1 transition-transform"
                    >
                      {step.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Col: Webhook Connection Details Card */}
        <div className="space-y-6">
          <div className="bg-surface border border-accent/20 rounded-xl p-6 relative overflow-hidden shadow-[0_0_40px_rgba(214,255,0,0.02)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
            
            <h3 className="font-semibold text-white font-syne mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-accent" /> Meta Webhook Details
            </h3>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-secondary uppercase tracking-wider font-bold text-[9px]">Callback URL</label>
                <div className="p-2.5 bg-background border border-border rounded-lg font-mono text-white break-all select-all hover:border-white/20 transition-colors">
                  https://jawaab-ai.vercel.app/api/whatsapp/webhook
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-secondary uppercase tracking-wider font-bold text-[9px]">Verify Token</label>
                <div className="p-2.5 bg-background border border-border rounded-lg font-mono text-white break-all select-all hover:border-white/20 transition-colors">
                  jawaab_verify_token_123
                </div>
              </div>

              <div className="bg-background/50 border border-border/40 p-3 rounded-lg text-secondary leading-relaxed space-y-1.5 mt-2">
                <p className="font-semibold text-white">How to connect:</p>
                <p>1. Open Meta App Dashboard.</p>
                <p>2. Set Webhooks to WhatsApp Business Account.</p>
                <p>3. Subscribe to the "messages" field.</p>
              </div>
            </div>
          </div>

          {/* Quick FAQ info panel */}
          <div className="bg-surface/30 border border-border/60 rounded-xl p-5 space-y-3">
            <h4 className="font-semibold text-white text-sm font-syne">Need assistance?</h4>
            <p className="text-secondary text-xs leading-relaxed">
              If you run into issues connecting your Meta Developer credentials, email our integration specialists at <a href="mailto:support@jawab.ai" className="text-accent hover:underline font-bold">support@jawab.ai</a> for free setup support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
