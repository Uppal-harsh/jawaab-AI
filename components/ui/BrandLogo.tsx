'use client';

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Character mapping for "Jawab AI" to split them
  const brandName = "Jawab AI";

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if the user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Set to static visual state
      anime.set(containerRef.current.querySelectorAll('.brand-char'), {
        opacity: 1,
        translateY: 0,
        scale: 1,
      });
      return;
    }

    // Mount Entrance Animation: letters drop in with bounce
    anime({
      targets: containerRef.current.querySelectorAll('.brand-char'),
      opacity: [0, 1],
      translateY: [-15, 0],
      scale: [0.85, 1],
      delay: anime.stagger(40),
      duration: 1200,
      easing: 'easeOutElastic(1, 0.6)',
    });
  }, []);

  const handleMouseEnter = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    // Hover Wave Stagger Effect: scale letters up/down in a wave
    anime({
      targets: containerRef.current.querySelectorAll('.brand-char'),
      scale: [
        { value: 1.22, duration: 150, easing: 'easeOutQuad' },
        { value: 1.0, duration: 250, easing: 'easeInQuad' }
      ],
      color: [
        { value: '#D6FF00', duration: 150 }, // temporary highlight
        { value: '#FFFFFF', duration: 300 }  // return to primary
      ],
      delay: anime.stagger(30),
    });
  };

  // Setup size styling
  const sizeClasses = {
    sm: 'text-sm tracking-tight gap-0.5',
    md: 'text-lg md:text-xl tracking-tight gap-1',
    lg: 'text-3xl md:text-5xl tracking-tighter gap-1.5',
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      className={`font-syne font-extrabold flex items-center select-none cursor-pointer ${sizeClasses[size]} ${className}`}
      aria-label="Jawab AI Logo"
    >
      {brandName.split('').map((char, idx) => (
        <span 
          key={idx} 
          className={`brand-char inline-block origin-center transition-all ${
            char === ' ' ? 'w-1.5 md:w-2' : ''
          } ${char === 'A' || char === 'I' ? 'text-accent' : 'text-white'}`}
          style={{ opacity: 0 }} // Start invisible for animation
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}
