'use client';

import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Phone, MessageSquare, ArrowRight } from 'lucide-react';

export function InteractiveDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Accessibility: Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Show final states statically
      setStep(4);
      anime.set('.demo-phone-screen, .demo-ai-wave, .demo-transcript-line, .demo-whatsapp-card', {
        opacity: 1,
        translateY: 0,
        translateX: 0
      });
      return;
    }

    const tl = anime.timeline({
      loop: true,
      easing: 'easeInOutSine',
      duration: 1500,
    });

    // Step 1: Customer Calling
    tl.add({
      targets: '.demo-phone-screen',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800,
      begin: () => setStep(1),
    })
    // Step 2: AI Answers
    .add({
      targets: '.demo-ai-wave',
      scaleY: [0.1, 1, 0.5, 1.2, 0.8, 1],
      opacity: [0, 1],
      duration: 2000,
      begin: () => setStep(2),
    }, '+=500')
    // Step 3: Transcription / Conversation
    .add({
      targets: '.demo-transcript-line',
      opacity: [0, 1],
      translateX: [-10, 0],
      delay: anime.stagger(600),
      duration: 800,
      begin: () => setStep(3),
    })
    // Step 4: WhatsApp Notification
    .add({
      targets: '.demo-whatsapp-card',
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 800,
      begin: () => setStep(4),
    }, '+=1000')
    // Step 5: End & Reset wait
    .add({
      targets: '.demo-reset-wait', // Dummy target for delay
      duration: 3000,
    });

    return () => {
      tl.pause();
      // Remove instances to avoid React memory leaks on unmount
      anime.remove('.demo-phone-screen, .demo-ai-wave, .demo-transcript-line, .demo-whatsapp-card, .demo-reset-wait');
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto mt-10 md:mt-20 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 px-4">
      
      {/* Customer WhatsApp Side */}
      <div className="relative w-full max-w-[280px] h-[440px] md:h-[500px] rounded-[2rem] md:rounded-[2.5rem] border-[6px] md:border-[8px] border-[#222] bg-[#111] overflow-hidden shadow-2xl flex flex-col">
        <div className="absolute top-0 inset-x-0 h-5 md:h-6 bg-[#222] rounded-b-3xl w-24 md:w-32 mx-auto z-10"></div>
        <div className="demo-phone-screen flex-1 p-4 md:p-6 flex flex-col justify-start opacity-0 pt-8 md:pt-10">
          <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-4">
            <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center font-bold text-xs text-black">WA</div>
            <div>
              <h3 className="text-xs font-semibold text-white">Jawaab Customer Support</h3>
              <p className="text-[9px] text-green-400 font-medium">Online</p>
            </div>
          </div>
          <div className="space-y-3 flex-1 flex flex-col justify-end pb-4">
            <div className="demo-ai-wave bg-[#222] p-2.5 rounded-lg text-[10px] text-secondary self-start max-w-[85%] font-medium">
              Hello! Welcome to SmileCare. How can I help you book an appointment today?
            </div>
            <div className="demo-transcript-line opacity-0 bg-[#075e54] text-white p-2.5 rounded-lg text-[10px] self-end max-w-[85%] font-medium">
              Hi, I want to schedule a dental checkup for tomorrow at 3 PM. My name is Rahul.
            </div>
            <div className="demo-transcript-line opacity-0 bg-[#222] p-2.5 rounded-lg text-[10px] text-secondary self-start max-w-[85%] font-medium">
              Got it, Rahul! I have reserved tomorrow at 3 PM for you. Greet you then! [INTENT: BookAppointment]
            </div>
          </div>
        </div>
      </div>

      {/* Connection Logic Arrow */}
      <div className="hidden md:flex flex-col items-center gap-2 md:gap-4 text-secondary">
        <div className="text-[10px] md:text-xs tracking-widest uppercase opacity-50 text-center">
          {step === 1 && 'Message Received'}
          {step === 2 && 'AI Analyzes Context'}
          {step === 3 && 'Replies & Logs Lead'}
          {step === 4 && 'CRM Dashboard Updated'}
        </div>
        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 animate-pulse text-border" />
      </div>

      {/* Business CRM Side */}
      <div className="relative w-full max-w-[280px] h-[440px] md:h-[500px] rounded-[2rem] md:rounded-[2.5rem] border-[6px] md:border-[8px] border-[#222] bg-surface overflow-hidden shadow-2xl flex flex-col p-3 md:p-4">
        <div className="flex items-center justify-between border-b border-border pb-3 md:pb-4 mb-3 md:mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 text-accent" />
            </div>
            <span className="font-medium text-xs md:text-sm">Jawaab CRM Portal</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-start">
          <div className="demo-whatsapp-card opacity-0 bg-[#2A2A2A] border border-border p-3 md:p-4 rounded-xl shadow-lg mt-4">
            <h4 className="text-xs md:text-sm font-semibold text-white mb-1.5 md:mb-2 flex items-center gap-1.5">
              <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-green-400 animate-pulse"></span>
              New CRM Lead Logged
            </h4>
            <p className="text-[10px] md:text-xs text-secondary mb-0.5 md:mb-1"><strong>Name:</strong> Rahul</p>
            <p className="text-[10px] md:text-xs text-secondary mb-0.5 md:mb-1"><strong>Channel:</strong> WhatsApp Business</p>
            <p className="text-[10px] md:text-xs text-secondary mb-0.5 md:mb-1"><strong>Status:</strong> Appointment Booked ✅</p>
            <p className="text-[10px] md:text-xs text-secondary mb-2 md:mb-3"><strong>Booked time:</strong> Tomorrow 3:00 PM</p>
            <button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-black text-[10px] md:text-xs font-semibold py-1.5 md:py-2 rounded transition-colors">
              Chat on WhatsApp
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
