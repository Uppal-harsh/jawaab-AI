'use client';

import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
      primary: "bg-primary text-background hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)]",
      secondary: "bg-surface text-primary hover:bg-hover border border-border",
      outline: "border border-border text-primary hover:bg-hover hover:border-white/20",
      ghost: "text-secondary hover:text-primary hover:bg-hover",
    };

    const sizes = {
      sm: "h-9 px-3",
      md: "h-10 px-4 py-2",
      lg: "h-12 px-8 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
