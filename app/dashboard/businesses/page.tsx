'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';

interface KnowledgeCard {
  id?: string;
  category: string;
  question_trigger: string;
  answer_content: string;
}

export default function BusinessProfile() {
  // Business states
  const [name, setName] = useState('SmileCare Dental');
  const [ownerName, setOwnerName] = useState('Dr. Sharma');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [greeting, setGreeting] = useState('Namaste. Welcome to SmileCare Dental. How can we help you smile today?');
  const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
  const [language, setLanguage] = useState('auto');
  const [whatsappNumber, setWhatsappNumber] = useState('+91 98765 43210');

  // UI state feedback
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Knowledge Cards state
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newTrigger, setNewTrigger] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('faq');
  const [cardSubmitting, setCardSubmitting] = useState(false);

  // Fetch business and cards on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Business profile
        const bRes = await fetch('/api/business');
        if (bRes.ok) {
          const { business, settings } = await bRes.json();
          if (business) {
            setName(business.name || '');
            setOwnerName(business.owner_name || '');
            setPhone(business.phone_number || '');
            setWhatsappNumber(business.whatsapp_number || '');
          }
          if (settings) {
            setGreeting(settings.greeting_message || '');
            setVoiceGender(settings.voice_gender || 'female');
            // Support default fallback values
          }
        }
        
        // Fetch Knowledge Cards
        await fetchCards();
      } catch (err) {
        console.error('Failed to prefill inputs:', err);
      } finally {
        setPageLoading(false);
      }
    }
    fetchData();
  }, []);

  const fetchCards = async () => {
    try {
      const cRes = await fetch('/api/knowledge-cards');
      if (cRes.ok) {
        const data = await cRes.json();
        setCards(data.cards || []);
      }
    } catch (e) {
      console.error('Failed to load knowledge cards:', e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    // Prepare matching payload schema
    const payload = {
      name,
      owner_name: ownerName,
      phone_number: phone,
      whatsapp_number: whatsappNumber,
      operating_hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
      fallback_number: phone,
      voice_gender: voiceGender,
      greeting_message: greeting,
    };

    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to save configuration');
      }

      setStatusMsg({ type: 'success', text: 'Business profile successfully updated.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'An error occurred while saving.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrigger || !newAnswer) return;

    setCardSubmitting(true);
    try {
      const res = await fetch('/api/knowledge-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          question_trigger: newTrigger,
          answer_content: newAnswer,
          is_active: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create fact');
      }

      setNewTrigger('');
      setNewAnswer('');
      setShowAddCard(false);
      await fetchCards();
    } catch (err: any) {
      alert(err.message || 'Could not save new knowledge card.');
    } finally {
      setCardSubmitting(false);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fact?')) return;

    try {
      const res = await fetch(`/api/knowledge-cards?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCards();
      } else {
        throw new Error('Deletion failed');
      }
    } catch (e) {
      alert('Could not delete knowledge card.');
    }
  };

  if (pageLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="text-sm">Loading configurations...</p>
      </div>
    );
  }

  return (
    <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" onSubmit={handleSaveProfile}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Business Profile</h1>
          <p className="text-secondary text-sm">Configure how the AI receptionist represents your company.</p>
        </div>
        <Button type="submit" className="gap-2 font-bold" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </Button>
      </header>

      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs ${
          statusMsg.type === 'success' 
            ? 'bg-accent/10 border-accent/20 text-accent' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {statusMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4 border-b border-border pb-4 text-white">General Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Business Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Owner Name</label>
                  <input 
                    type="text" 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Phone Number (SIP Caller ID)</label>
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">AI Greeting Message</label>
                <textarea 
                  rows={2} 
                  value={greeting} 
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors resize-none" 
                  required
                />
              </div>
            </div>
          </div>

          {/* Knowledge Cards */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <h2 className="text-lg font-medium text-white">Knowledge Base FAQs</h2>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                className="gap-2 h-8 text-xs font-bold"
                onClick={() => setShowAddCard(!showAddCard)}
              >
                <Plus className="w-3.5 h-3.5" /> Add Fact
              </Button>
            </div>

            {/* Add card inline form */}
            {showAddCard && (
              <div className="bg-background border border-border rounded-lg p-4 mb-4 space-y-3 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-secondary uppercase">Trigger Question</label>
                    <input 
                      type="text"
                      placeholder="e.g. consultation fee?"
                      value={newTrigger}
                      onChange={(e) => setNewTrigger(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-secondary uppercase">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent text-white"
                    >
                      <option value="faq">General FAQ</option>
                      <option value="pricing">Pricing</option>
                      <option value="timings">Timings</option>
                      <option value="services">Services</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-secondary uppercase">Answer Content</label>
                  <textarea 
                    rows={2}
                    placeholder="Provide the exact answer injection..."
                    value={newAnswer}
                    onChange={(e) => setNewAnswer(e.target.value)}
                    className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent text-white resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddCard(false)}>Cancel</Button>
                  <Button type="button" size="sm" className="h-7 text-xs font-bold" onClick={handleAddCard} disabled={cardSubmitting}>
                    {cardSubmitting ? 'Saving...' : 'Save Fact'}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {cards.length > 0 ? (
                cards.map((faq) => (
                  <div key={faq.id} className="bg-background border border-border rounded-md p-3 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-accent">Trigger: {faq.question_trigger}</p>
                      <p className="text-sm text-secondary leading-relaxed">{faq.answer_content}</p>
                    </div>
                    {faq.id && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteCard(faq.id!)}
                        className="text-secondary hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                        title="Delete Fact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-secondary border border-dashed border-border rounded-md">
                  No custom facts configured. Click "Add Fact" to initialize knowledge triggers.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4 border-b border-border pb-4 text-white">Voice Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Receptionist Voice</label>
                <select 
                  value={voiceGender}
                  onChange={(e) => setVoiceGender(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
                >
                  <option value="female">Meera (Female, Warm)</option>
                  <option value="male">Ravish (Male, Professional)</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Primary Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
                >
                  <option value="auto">Auto-Detect (Hinglish/Hindi/English)</option>
                  <option value="en">English Only</option>
                  <option value="hi">Hindi Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4 border-b border-border pb-4 text-white">Notifications</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider">WhatsApp Delivery Number</label>
                <input 
                  type="tel" 
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                  required
                />
                <p className="text-[10px] text-secondary mt-1">This number will receive instant lead summaries.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
