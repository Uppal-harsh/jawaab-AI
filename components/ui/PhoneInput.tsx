'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Country {
  name: string;
  code: string;
  flag: string;
}

const countries: Country[] = [
  { name: 'India', code: '+91', flag: '🇮🇳' },
  { name: 'United States', code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' },
  { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' },
  { name: 'Germany', code: '+49', flag: '🇩🇪' },
  { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' },
  { name: 'South Africa', code: '+27', flag: '🇿🇦' },
  { name: 'New Zealand', code: '+64', flag: '🇳🇿' },
  { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: '+62', flag: '🇮🇩' },
  { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Mexico', code: '+52', flag: '🇲🇽' },
  { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: '+82', flag: '🇰🇷' },
];

interface PhoneInputProps {
  value: string;
  onChange: (fullNumber: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder = 'Enter number', required = false, className = '' }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value to separate code and number
  useEffect(() => {
    if (!value) {
      setPhoneNumber('');
      return;
    }

    // Try to match value with country codes
    const sortedCountries = [...countries].sort((a, b) => b.code.length - a.code.length);
    const matchedCountry = sortedCountries.find(c => value.startsWith(c.code));

    if (matchedCountry) {
      setSelectedCountry(matchedCountry);
      // Strip country code and any leading spaces/zeros
      const rawNumber = value.slice(matchedCountry.code.length).trim();
      setPhoneNumber(rawNumber);
    } else {
      // Default to no country code if no match
      setPhoneNumber(value);
    }
  }, [value]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearch('');
    // Emit new full number
    onChange(`${country.code}${phoneNumber.trim()}`);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, ''); // Digits only
    setPhoneNumber(rawVal);
    onChange(`${selectedCountry.code}${rawVal}`);
  };

  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.code.includes(search)
  );

  return (
    <div ref={containerRef} className={`relative flex items-stretch rounded-md border border-border bg-background focus-within:border-accent transition-colors ${className}`}>
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 bg-surface hover:bg-white/5 border-r border-border text-sm text-white select-none shrink-0 rounded-l-md transition-colors"
      >
        <span className="text-base">{selectedCountry.flag}</span>
        <span className="font-semibold">{selectedCountry.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-secondary shrink-0" />
      </button>

      {/* Number Input */}
      <input
        type="tel"
        required={required}
        placeholder={placeholder}
        value={phoneNumber}
        onChange={handleNumberChange}
        className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none text-white w-full placeholder:text-secondary/60"
      />

      {/* Country Selector Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Header */}
          <div className="p-2 border-b border-border bg-background flex items-center gap-2">
            <Search className="w-4 h-4 text-secondary shrink-0" />
            <input
              type="text"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-white focus:outline-none"
              autoFocus
            />
          </div>

          {/* List Options */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleCountrySelect(c)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors hover:bg-white/5 ${
                    selectedCountry.code === c.code && selectedCountry.name === c.name 
                      ? 'bg-accent/10 text-accent font-bold' 
                      : 'text-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{c.flag}</span>
                    <span className="truncate max-w-[140px]">{c.name}</span>
                  </span>
                  <span className="font-mono text-[10px] text-secondary/80">{c.code}</span>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs text-secondary">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
