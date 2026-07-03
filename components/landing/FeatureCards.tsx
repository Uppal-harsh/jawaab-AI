'use client';

import React from 'react';
import { useAnime } from '../../hooks/useAnime';
import anime from 'animejs';
import { 
  Clock, 
  MessageCircle, 
  Globe2, 
  Smartphone, 
  Database, 
  ListOrdered, 
  Zap,
  ShieldCheck 
} from 'lucide-react';

const features = [
  {
    title: '24×7 Receptionist',
    description: 'Never miss a lead outside of business hours, during holidays, or while you are busy serving a customer.',
    icon: <Clock className="w-5 h-5 text-accent" />,
  },
  {
    title: 'Native Language Support',
    description: 'Seamlessly understands and responds in the languages your local customers actually speak.',
    icon: <Globe2 className="w-5 h-5 text-accent" />,
    chips: ['English', 'हिन्दी', 'Hinglish']
  },
  {
    title: 'Instant WhatsApp Summaries',
    description: 'Get notified immediately after a call drops. See who called, why, and if they need a callback right on WhatsApp.',
    icon: <MessageCircle className="w-5 h-5 text-[#25D366]" />,
  },
  {
    title: 'Dynamic Business Knowledge',
    description: 'Train the AI instantly using simple FAQs. It answers pricing and timings exactly how you instruct it to.',
    icon: <Database className="w-5 h-5 text-accent" />,
  },
  {
    title: 'Detailed Call Logs',
    description: 'Access full voice transcripts, audio recordings, and structured metrics to review every interaction.',
    icon: <ListOrdered className="w-5 h-5 text-accent" />,
  },
  {
    title: 'Setup in 5 Minutes',
    description: 'No complex coding or workflows. Add your number, write a greeting, and go live immediately.',
    icon: <Zap className="w-5 h-5 text-accent" />,
  },
];

export function FeatureCards() {
  const { ref } = useAnime<HTMLDivElement>({
    animation: (el) => {
      anime({
        targets: (el as HTMLElement).querySelectorAll('.feature-card'),
        translateY: [30, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 800,
        delay: anime.stagger(100),
      });
    },
  });

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 py-24">
      {features.map((feature, idx) => (
        <div 
          key={idx} 
          className="feature-card opacity-0 bg-surface border border-border p-8 rounded-2xl hover:border-accent/30 transition-colors group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center mb-6 relative z-10">
            {feature.icon}
          </div>
          <h3 className="text-lg font-medium text-primary mb-3 relative z-10">{feature.title}</h3>
          <p className="text-sm text-secondary leading-relaxed mb-4 relative z-10">{feature.description}</p>
          
          {feature.chips && (
            <div className="flex flex-wrap gap-2 relative z-10 mt-4">
              {feature.chips.map(chip => (
                <span key={chip} className="text-xs font-medium bg-background border border-border px-3 py-1 rounded-full text-secondary">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
