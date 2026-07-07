'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import anime from 'animejs';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  const pandaRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mount Entrance Animation
    anime({
      targets: pandaRef.current,
      translateY: [-50, 0],
      opacity: [0, 1],
      duration: 1200,
      easing: 'easeOutElastic(1, 0.6)',
    });

    anime({
      targets: textRef.current,
      translateY: [20, 0],
      opacity: [0, 1],
      duration: 1000,
      delay: 300,
      easing: 'easeOutQuad',
    });

    // Gentle swinging animation for the panda to simulate hanging off a bamboo
    anime({
      targets: '.swinging-panda',
      rotate: [-3, 3],
      duration: 2000,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.03)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[45%] h-[45%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(255,255,255,0.01)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg text-center space-y-8 relative z-10">
        {/* Panda Hanging Container */}
        <div ref={pandaRef} className="flex justify-center select-none">
          <div className="relative swinging-panda origin-top">
            {/* The Bamboo Line wrapper/visual support */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-12 bg-gradient-to-b from-green-600 to-green-500 rounded-full"></div>
            
            <div className="pt-10">
              <img 
                src="/panda-404.png" 
                alt="Cute panda hanging off a bamboo" 
                className="w-48 h-48 md:w-56 md:h-56 object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>
        </div>

        {/* Text and Actions */}
        <div ref={textRef} className="space-y-6 opacity-0">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-syne font-bold text-white tracking-tight">
              Hang in there!
            </h1>
            <p className="text-secondary text-sm md:text-base max-w-md mx-auto">
              This page seems to have slipped away or doesn't exist. Don't worry, our AI voice receptionist is still online and answering calls!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/" passHref legacyBehavior>
              <Button size="lg" className="w-full sm:w-auto gap-2">
                <Home className="w-4 h-4" /> Go Back Home
              </Button>
            </Link>
            
            <Link href="/demo" passHref legacyBehavior>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2 border border-border bg-surface/50 hover:bg-surface">
                Test AI Receptionist
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
