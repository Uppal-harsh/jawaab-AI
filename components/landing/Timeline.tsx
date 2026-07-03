'use client';

import React, { useRef, useEffect } from 'react';
import anime from 'animejs';
import { PhoneCall, Bot, Mic, CheckCircle2, MessageSquare, PhoneForwarded } from 'lucide-react';

const steps = [
  { label: 'Customer Calls', icon: <PhoneCall className="w-5 h-5 text-primary" /> },
  { label: 'AI Answers', icon: <Bot className="w-5 h-5 text-accent" /> },
  { label: 'Conversation', icon: <Mic className="w-5 h-5 text-primary" /> },
  { label: 'Lead Captured', icon: <CheckCircle2 className="w-5 h-5 text-accent" /> },
  { label: 'WhatsApp Summary', icon: <MessageSquare className="w-5 h-5 text-[#25D366]" /> },
  { label: 'Owner Calls Back', icon: <PhoneForwarded className="w-5 h-5 text-primary" /> },
];

export function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Use Intersection Observer to trigger animation when visible
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        anime({
          targets: '.timeline-step',
          opacity: [0, 1],
          translateX: [-20, 0],
          delay: anime.stagger(400),
          easing: 'easeOutQuad',
          duration: 600,
        });

        anime({
          targets: '.timeline-connector',
          width: ['0%', '100%'],
          easing: 'easeInOutSine',
          duration: 400,
          delay: anime.stagger(400, { start: 200 }),
        });
        
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto py-24 px-6 overflow-hidden">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-semibold mb-4 tracking-tight">How It Works</h2>
        <p className="text-secondary">A completely hands-off process from missed call to recovered lead.</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center relative gap-6 md:gap-0">
        {steps.map((step, idx) => (
          <div key={idx} className="timeline-step opacity-0 flex flex-col items-center relative z-10 w-full md:w-auto">
            <div className="w-14 h-14 bg-surface border border-border rounded-full flex items-center justify-center mb-4 relative z-10 shadow-lg">
              {step.icon}
            </div>
            <p className="text-sm font-medium text-center">{step.label}</p>
            
            {/* Connector line for desktop */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-7 left-[50%] w-[150%] h-[2px] bg-border -z-10">
                <div className="timeline-connector h-full bg-accent/50 w-0"></div>
              </div>
            )}
            
            {/* Connector line for mobile */}
            {idx < steps.length - 1 && (
              <div className="block md:hidden absolute top-[100%] left-[50%] w-[2px] h-[24px] bg-border -translate-x-1/2">
                <div className="timeline-connector w-full bg-accent/50 h-0" style={{ transition: 'height 0.4s' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
