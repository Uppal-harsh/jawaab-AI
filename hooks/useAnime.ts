'use client';

import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';

interface UseAnimeProps {
  animation: (target: HTMLElement | SVGElement | NodeListOf<Element>) => void;
  runOnMount?: boolean;
}

export function useAnime<T extends HTMLElement | SVGElement>({ animation, runOnMount = true }: UseAnimeProps) {
  const ref = useRef<T>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    // Accessibility: Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (runOnMount && ref.current && !hasRun) {
      if (prefersReducedMotion) {
        // Skip animation and force immediate target state if possible 
        // (For simplicity in this hook, we just don't run the animation, 
        // but robust apps might snap elements to their final states here).
        (anime as any).speed = 0; 
        animation(ref.current);
        (anime as any).speed = 1;
      } else {
        animation(ref.current);
      }
      setHasRun(true);
    }
  }, [animation, runOnMount, hasRun]);

  const trigger = () => {
    if (ref.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        (anime as any).speed = 0;
        animation(ref.current);
        (anime as any).speed = 1;
      } else {
        animation(ref.current);
      }
    }
  };

  return { ref, trigger };
}

// Utility to stagger text characters safely
export function splitText(text: string): string {
  return text.split(' ').map(word => {
    const chars = word.split('').map(char => 
      `<span class="inline-block anime-char" style="opacity:0">${char}</span>`
    ).join('');
    return `<span class="inline-block whitespace-nowrap">${chars}</span>`;
  }).join(' ');
}
