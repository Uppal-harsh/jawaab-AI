'use client';

import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if the user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      anime.set(containerRef.current, {
        opacity: 1,
        scale: 1,
      });
      return;
    }

    // Mount Entrance Animation: logo fades in and scale up gently
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: 1000,
      easing: 'easeOutExpo',
    });
  }, []);

  const handleMouseEnter = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    // Hover Animation: scale up slightly
    anime({
      targets: containerRef.current,
      scale: 1.04,
      duration: 200,
      easing: 'easeOutQuad',
    });
  };

  const handleMouseLeave = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !containerRef.current) return;

    // Return to default scale
    anime({
      targets: containerRef.current,
      scale: 1.0,
      duration: 200,
      easing: 'easeOutQuad',
    });
  };

  // Setup heights for the logo images based on the size prop
  const sizeClasses = {
    sm: 'h-7 md:h-8',
    md: 'h-10 md:h-12',
    lg: 'h-16 md:h-20',
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`inline-flex items-center select-none cursor-pointer origin-center ${className}`}
      aria-label="Jawaab AI Logo"
      style={{ opacity: 0 }} // Start invisible for animation
    >
      <img 
        src="/logo.png" 
        alt="Jawaab AI" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}
