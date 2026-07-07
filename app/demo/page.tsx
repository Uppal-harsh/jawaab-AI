'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Play, Volume2, Maximize, CheckCircle2, PhoneCall, Smartphone, Sparkles, MessageSquare } from 'lucide-react';
import { Navbar } from '../../components/ui/Navbar';

export default function DemoPage() {
  const router = useRouter();
  const [isPlaying, setIsPlaying] = useState(false);

  // Workflow steps detailing how Jawaab AI works
  const demoSteps = [
    {
      title: '1. Missed Call Forwarding',
      description: 'A customer dials your business number. If you are busy, reject the call, or are out of coverage, your carrier automatically routes the call to your Jawaab AI virtual SIP channel.',
      icon: <PhoneCall className="w-5 h-5 text-accent" />,
      time: '0:05'
    },
    {
      title: '2. Conversational Answering',
      description: 'The AI answers instantly with a friendly native greeting (English, Hindi, or Hinglish). No buttons to press, no delay—just natural speech.',
      icon: <Sparkles className="w-5 h-5 text-accent" />,
      time: '0:15'
    },
    {
      title: '3. Knowledge Card Extraction',
      description: 'When the caller asks about pricing, consultation fees, or timings, the AI instantly retrieves information from your custom knowledge cards to answer without hallucinations.',
      icon: <CheckCircle2 className="w-5 h-5 text-accent" />,
      time: '0:35'
    },
    {
      title: '4. Summary Dispatch',
      description: 'Immediately after the call ends, Jawaab AI compiles caller names, requested callbacks, intent, and summary details into a WhatsApp message and dispatches it directly to you.',
      icon: <MessageSquare className="w-5 h-5 text-[#25D366]" />,
      time: '0:50'
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      
      {/* Decorative radial glows */}
      <div className="absolute top-[20%] left-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="pt-28 pb-20 px-4 max-w-5xl mx-auto flex-1 w-full flex flex-col justify-center">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-4 font-syne text-white">
            Watch Jawaab AI in Action.
          </h1>
          <p className="text-secondary text-sm md:text-base text-balance max-w-xl mx-auto">
            See how the voice receptionist operates in real-time, handles Hinglish calls, and forwards lead alerts directly to your WhatsApp.
          </p>
        </div>

        {/* Video & Steps Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start w-full">
          
          {/* Video Player Showcase (3/5 columns) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-surface border border-border overflow-hidden shadow-2xl flex flex-col items-center justify-center group">
              
              {/* Playback Simulation Overlay */}
              {!isPlaying ? (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-10 transition-opacity p-6 text-center">
                  <button 
                    onClick={() => setIsPlaying(true)}
                    className="w-16 h-16 rounded-full bg-accent hover:scale-105 transition-transform flex items-center justify-center text-black mb-4 shadow-[0_0_20px_rgba(214,255,0,0.3)]"
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </button>
                  <p className="text-xs font-semibold tracking-wider text-white uppercase">Play Demo Video</p>
                  <p className="text-[10px] text-secondary mt-1">1 minute walkthrough of Jawaab AI</p>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                  {/* Mock Video Element or Real video. Sticking with styled video tag */}
                  <video 
                    className="w-full h-full object-cover" 
                    controls 
                    autoPlay
                    src="https://assets.mixkit.co/videos/preview/mixkit-recording-studio-worker-typing-on-keyboard-40348-large.mp4"
                    onEnded={() => setIsPlaying(false)}
                  />
                </div>
              )}

              {/* Styled Mock Video Frame fallback layout */}
              {!isPlaying && (
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1b1b1b] to-[#121212] flex flex-col justify-between p-6">
                  {/* Mock Top Info */}
                  <div className="flex justify-between items-center text-xs text-secondary">
                    <span>Jawaab AI Receptionist Walkthrough</span>
                    <span>1:00 min</span>
                  </div>
                  {/* Mock Center Wave animation */}
                  <div className="flex justify-center items-end gap-1.5 h-16">
                    {[1.2, 0.8, 1.5, 0.9, 1.3, 0.7, 1.1].map((scale, i) => (
                      <div key={i} className="w-1.5 bg-accent/35 rounded-full h-full origin-bottom" style={{ transform: `scaleY(${scale})` }}></div>
                    ))}
                  </div>
                  {/* Mock Controls bar */}
                  <div className="flex justify-between items-center border-t border-border pt-4 text-secondary">
                    <div className="flex items-center gap-4">
                      <Play className="w-4 h-4 cursor-pointer hover:text-white" />
                      <Volume2 className="w-4 h-4 cursor-pointer hover:text-white" />
                      <span className="text-[10px]">00:00 / 01:00</span>
                    </div>
                    <Maximize className="w-4 h-4 cursor-pointer hover:text-white" />
                  </div>
                </div>
              )}

            </div>

            {/* Quick Summary Card */}
            <div className="bg-surface/50 border border-border p-5 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-accent/30 transition-colors" onClick={() => router.push('/login?mode=signup')}>
              <div className="p-3 bg-accent/15 text-accent rounded-xl">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Interactive Call Testing</h4>
                <p className="text-xs text-secondary mt-1">
                  Want to try dialing Jawaab AI live? Click here to register and trigger a mock call directly to your admin console.
                </p>
              </div>
            </div>
          </div>

          {/* Timestamp Walkthrough Timeline (2/5 columns) */}
          <div className="lg:col-span-2 space-y-6 bg-surface/30 border border-border p-6 rounded-2xl">
            <h3 className="text-lg font-semibold text-white font-syne pb-4 border-b border-border">
              Timeline Walkthrough
            </h3>
            <div className="space-y-6">
              {demoSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== demoSteps.length - 1 && (
                    <div className="absolute left-[18px] top-8 bottom-[-24px] w-px bg-border"></div>
                  )}
                  <div className="w-9 h-9 rounded-full bg-[#222] border border-border flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="text-sm font-semibold text-white font-syne">{step.title}</h4>
                      <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                        {step.time}
                      </span>
                    </div>
                    <p className="text-[11px] md:text-xs text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-xs text-secondary bg-background/50">
        <p>© 2026 Jawaab AI. All rights reserved.</p>
      </footer>

    </div>
  );
}
