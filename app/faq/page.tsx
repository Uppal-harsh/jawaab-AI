'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { Plus, Minus, Search, HelpCircle } from 'lucide-react';
import { Navbar } from '../../components/ui/Navbar';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'telephony' | 'pricing' | 'config';
}

export default function FAQPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'telephony' | 'pricing' | 'config'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: 'Is Jawab AI a standard chatbot or automated IVR?',
      answer: 'No. Traditional IVRs force callers to press keys (e.g., "Press 1 for Sales"). Chatbots rely on static script paths. Jawab AI acts as a natural conversational voice receptionist. It listens to the caller, understands context, speaks fluidly (in English, Hindi, or Hinglish), answers custom business questions using your knowledge cards, and captures lead information just like a real human receptionist.'
    },
    {
      category: 'general',
      question: 'Does Jawab AI sound like a robot?',
      answer: 'We utilize state-of-the-art voice synthesize models from Sarvam AI, fine-tuned specifically for Indian accents and dual-language switching (Hinglish/Hindi/English). The result is a highly natural, friendly tone (options like Meera or Ravish) that callers can converse with comfortably.'
    },
    {
      category: 'telephony',
      question: 'Do I need to change my business phone number?',
      answer: 'No. Through our Exotel integration, you can set up Call Forwarding on your existing mobile or landline number. When you are busy, reject a call, or are out of coverage, the carrier automatically forwards the call to your Jawab AI virtual SIP channel to answer.'
    },
    {
      category: 'telephony',
      question: 'How do I receive the lead notifications?',
      answer: 'As soon as the call ends, Jawab AI compiles a structural summary (caller name, purpose, callback requests, and raw transcript) and instantly dispatches a WhatsApp alert to the business owner\'s phone. You can view, review transcripts, and click to return call instantly.'
    },
    {
      category: 'pricing',
      question: 'What happens if I exceed my plan\'s monthly call limit?',
      answer: 'If you exceed your monthly call allowance, calls will continue to be answered, but extra calls are billed at a flat rate of ₹8 per answered call. Alternatively, you can upgrade your plan at any time during the billing cycle to unlock a higher allocation.'
    },
    {
      category: 'pricing',
      question: 'Do you offer custom setups?',
      answer: 'Yes! For multi-location businesses, clinics with multiple doctors, or corporate service call queues, our Enterprise tier offers custom fine-tuned voice models, integrations with CRM systems, and dedicated Exotel numbers.'
    },
    {
      category: 'config',
      question: 'How do I train the AI receptionist about my business?',
      answer: 'You can customize Jawab AI\'s knowledge base in the Admin Dashboard. By creating simple "Knowledge Cards" (e.g., "Timings", "Consultation fees", "Address"), the receptionist automatically fetches this data and injects it into the conversation whenever a caller asks related questions.'
    },
    {
      category: 'config',
      question: 'Is user authentication secure?',
      answer: 'Absolutely. We route all dashboard logins and configuration updates through Supabase Authentication and RLS (Row Level Security) schemas. Sensitive tokens such as Exotel credentials and OpenRouter keys are encrypted and stored safely.'
    }
  ];

  // Filtering faqs based on category and search query
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleAccordion = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General Info' },
    { id: 'telephony', label: 'Telephony & Forwarding' },
    { id: 'pricing', label: 'Pricing & Billing' },
    { id: 'config', label: 'Customization & Support' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-between">
      
      {/* Decorative Blur Glows */}
      <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      {/* Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="pt-28 pb-20 px-4 max-w-4xl mx-auto flex-1 w-full flex flex-col justify-center">
        
        {/* Page Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-4 font-syne text-white">
            Frequently Asked Questions.
          </h1>
          <p className="text-secondary text-sm md:text-base text-balance max-w-xl mx-auto">
            Everything you need to know about Jawab AI voice receptionist for small business.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full max-w-xl mx-auto mb-10">
          <Search className="w-4 h-4 text-secondary absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or answers..."
            className="w-full bg-surface border border-border rounded-full pl-12 pr-6 py-3 text-sm focus:outline-none focus:border-accent transition-colors text-white"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as any);
                setExpandedIndex(null);
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === cat.id
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-surface border-border text-secondary hover:text-white hover:border-white/20'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 w-full">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-surface border border-border rounded-xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleAccordion(idx)}
                    className="w-full flex items-center justify-between p-5 text-left gap-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <HelpCircle className="w-5 h-5 text-accent shrink-0" />
                      <span className="font-semibold text-sm md:text-base text-white font-syne leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-accent shrink-0" />
                    ) : (
                      <Plus className="w-4 h-4 text-secondary shrink-0" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-secondary leading-relaxed border-t border-border/50 animate-in fade-in duration-300">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-secondary text-sm border border-dashed border-border rounded-2xl">
              No matching questions found. Try searching for other terms like 'timings' or 'number'.
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-border text-center text-xs text-secondary bg-background/50">
        <p>© 2026 Jawab AI. All rights reserved.</p>
      </footer>

    </div>
  );
}
