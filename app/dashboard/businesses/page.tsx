'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Save, Plus, Trash2, Loader2, MessageSquare, Shield, Sparkles, AlertCircle, Edit, CheckCircle } from 'lucide-react';

interface KnowledgeCard {
  id?: string;
  category: string;
  question_trigger: string;
  answer_content: string;
}

export default function BusinessProfile() {
  // Business states - START FULLY EMPTY
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [greeting, setGreeting] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [answeringMode, setAnsweringMode] = useState<'always_answer' | 'forwarded_only'>('always_answer');
  const [systemPrompt, setSystemPrompt] = useState('');
  
  // Custom or Generated Script option
  const [scriptMode, setScriptMode] = useState<'write' | 'generate'>('write');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

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

  // Calculate completion percentage based on the 6 key fields
  const getCompletionStats = () => {
    const fields = [
      { name: 'Business Name', filled: !!name.trim() },
      { name: 'Owner Name', filled: !!ownerName.trim() },
      { name: 'Phone Number', filled: !!phone.trim() },
      { name: 'CRM Delivery Number', filled: !!whatsappNumber.trim() },
      { name: 'Greeting Message', filled: !!greeting.trim() },
      { name: 'Bot Script', filled: !!systemPrompt.trim() },
    ];
    const filledCount = fields.filter((f) => f.filled).length;
    const percentage = Math.round((filledCount / fields.length) * 100);
    return { percentage, filledCount, total: fields.length, fields };
  };

  const { percentage, filledCount, total } = getCompletionStats();
  const isProfileLocked = percentage < 60; // 60% completion threshold

  // Fetch business and cards on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const bRes = await fetch('/api/business');
        if (bRes.ok) {
          const { business, settings, promptConfig } = await bRes.json();
          if (business) {
            setName(business.name || '');
            setOwnerName(business.owner_name || '');
            setPhone(business.phone_number || '');
            setWhatsappNumber(business.whatsapp_number || '');
          }
          if (settings) {
            setGreeting(settings.greeting_message || '');
            setAnsweringMode(settings.answering_mode || 'always_answer');
          }
          if (promptConfig) {
            setSystemPrompt(promptConfig.system_prompt || '');
          }
        }
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

    // Block saving answering configuration if profile is incomplete
    if (isProfileLocked && answeringMode === 'always_answer') {
      setStatusMsg({ 
        type: 'error', 
        text: 'Cannot save changes. Please complete at least 60% of your business details to activate the bot.' 
      });
      setLoading(false);
      return;
    }

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
      greeting_message: greeting,
      answering_mode: answeringMode,
      system_prompt: systemPrompt,
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

  const handleAIScriptGen = async () => {
    if (!name || !ownerName || !greeting) {
      alert('Please fill out Business Name, Owner Name, and AI Greeting first so the AI has enough context.');
      return;
    }
    
    setIsGeneratingScript(true);
    try {
      const res = await fetch('/api/business/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner_name: ownerName, phone_number: phone, greeting_message: greeting }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSystemPrompt(data.script || '');
      setScriptMode('write'); // focus write editor
      setStatusMsg({ type: 'success', text: 'AI prompt script generated successfully! You can customize it below.' });
    } catch (e: any) {
      alert(e.message || 'Could not generate script via OpenRouter.');
    } finally {
      setIsGeneratingScript(false);
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

  // Circular ring variables
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" onSubmit={handleSaveProfile}>
      
      {/* Header with Circular Completion Tracker */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-surface border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-5">
          {/* SVG Progress Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center select-none flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle 
                cx="40" 
                cy="40" 
                r={radius} 
                className="stroke-border fill-transparent" 
                strokeWidth="6" 
              />
              <circle 
                cx="40" 
                cy="40" 
                r={radius} 
                className="stroke-accent fill-transparent transition-all duration-500 ease-out" 
                strokeWidth="6" 
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-bold text-white font-syne">{percentage}%</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-syne">Business Profile</h1>
            <p className="text-secondary text-xs mt-1">Complete mandatory details to launch your AI WhatsApp automation.</p>
            <div className="flex gap-2.5 mt-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isProfileLocked 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
                  : 'bg-green-500/10 border border-green-500/20 text-green-400'
              }`}>
                {filledCount} of {total} fields filled
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isProfileLocked 
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' 
                  : 'bg-accent/10 border border-accent/20 text-accent'
              }`}>
                {isProfileLocked ? 'Min 60% required to activate' : 'Automation Unlocked'}
              </span>
            </div>
          </div>
        </div>

        <Button type="submit" className="gap-2 font-bold w-full md:w-auto" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Profile
        </Button>
      </header>

      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-start gap-2 ${
          statusMsg.type === 'success' 
            ? 'bg-accent/10 border-accent/20 text-accent' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Information Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4 border-b border-border pb-4 text-white font-syne flex items-center gap-2">
              <span className="w-1.5 h-3 bg-accent rounded-full"></span> General Information
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Business Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. SmileCare Dental"
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Owner Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dr. Sharma"
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Business Phone Number *</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +91 98765 43210"
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">AI Greeting Message *</label>
                <textarea 
                  rows={2} 
                  placeholder="Hello! Welcome to SmileCare Dental. How can we help you today?"
                  value={greeting} 
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors resize-none" 
                  required
                />
              </div>
            </div>
          </div>

          {/* WhatsApp bot prompt instructions script builder */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-lg font-medium text-white font-syne flex items-center gap-2">
                <span className="w-1.5 h-3 bg-accent rounded-full"></span> WhatsApp Bot Script
              </h2>
              <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg p-0.5">
                <button 
                  type="button"
                  onClick={() => setScriptMode('write')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    scriptMode === 'write' ? 'bg-surface text-white' : 'text-secondary hover:text-white'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button 
                  type="button"
                  onClick={() => setScriptMode('generate')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    scriptMode === 'generate' ? 'bg-surface text-white' : 'text-secondary hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> AI draft
                </button>
              </div>
            </div>

            {scriptMode === 'generate' ? (
              <div className="bg-background border border-border rounded-xl p-5 text-center space-y-4 py-8 animate-in fade-in duration-300">
                <Sparkles className="w-8 h-8 text-accent mx-auto animate-pulse" />
                <div className="max-w-xs mx-auto space-y-1">
                  <h3 className="font-semibold text-white text-sm font-syne">AI script Writer</h3>
                  <p className="text-[10px] text-secondary">Instantly outline client greeting protocols, business rules, and appointment guidance using OpenRouter context drafts.</p>
                </div>
                <Button 
                  type="button" 
                  onClick={handleAIScriptGen}
                  disabled={isGeneratingScript}
                  className="mx-auto font-bold text-xs"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Drafting Instructions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-background" /> Draft prompt script
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 animate-in fade-in duration-300">
                <textarea 
                  rows={6}
                  placeholder="Describe your bot's behavior, services pricing, and calendar policies..."
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent text-white font-mono leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px] text-secondary">
                  <span>Describe pricing lists, appointment timing constraints, etc.</span>
                  <span className="font-bold">{systemPrompt.length} characters</span>
                </div>
              </div>
            )}
          </div>

          {/* Knowledge Cards */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-border pb-4 mb-4">
              <h2 className="text-lg font-medium text-white font-syne flex items-center gap-2">
                <span className="w-1.5 h-3 bg-accent rounded-full"></span> Knowledge Base FAQs
              </h2>
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
          
          {/* WhatsApp Automation Switcher Card */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
            <h2 className="text-lg font-medium mb-4 border-b border-border pb-4 text-white font-syne flex items-center gap-2">
              <span className="w-1.5 h-3 bg-accent rounded-full"></span> Automation Mode
            </h2>
            
            {isProfileLocked ? (
              // LOCKED VIEW OVERLAY for under 60% completion
              <div className="bg-background/80 backdrop-blur-sm border border-red-500/20 p-4 rounded-xl text-center space-y-3">
                <AlertCircle className="w-7 h-7 text-red-400 mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-white font-syne">Automation Locked</h4>
                  <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                    You must complete at least 60% of your business details to start the WhatsApp agent.
                  </p>
                </div>
                <div className="h-[38px] bg-white/5 border border-border rounded px-3 flex items-center justify-between text-[10px] text-secondary select-none">
                  <span>Currently Disabled</span>
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                </div>
              </div>
            ) : (
              // UNLOCKED SELECT MENU
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Automation Rule</label>
                  <select 
                    value={answeringMode}
                    onChange={(e) => setAnsweringMode(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
                  >
                    <option value="always_answer">Always Autoreply (24/7 AI Automation)</option>
                    <option value="forwarded_only">Intelligent Assistant (Forward complex requests)</option>
                  </select>
                  <p className="text-[10px] text-secondary mt-1.5 leading-relaxed">
                    {answeringMode === 'always_answer' 
                      ? 'Jawaab AI replies automatically to every customer query instantly.' 
                      : 'Jawaab AI handles appointments booking and FAQ inquiries, forwarding complex support messages directly to you.'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-medium mb-4 border-b border-border pb-4 text-white font-syne flex items-center gap-2">
              <span className="w-1.5 h-3 bg-accent rounded-full"></span> WhatsApp CRM Delivery
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Owner Delivery Number *</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +91 98765 43210"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
                  required
                />
                <p className="text-[10px] text-secondary mt-1">Number that will receive real-time follow-up / callback alerts from the automation flow.</p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center py-8">
            <Shield className="w-10 h-10 text-[#25D366] mb-3 animate-pulse" />
            <h3 className="text-xs font-semibold text-white">Meta Verified Webhook</h3>
            <p className="text-[10px] text-secondary text-center mt-1 max-w-[180px]">Automated chat logs and appointments are secured via Meta Verified SSL protocols.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
