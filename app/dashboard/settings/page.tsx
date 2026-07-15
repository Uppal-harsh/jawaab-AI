'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Save, Globe, Smartphone, Calendar, Loader2 } from 'lucide-react';

export default function Settings() {
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('meta-llama/llama-3-8b-instruct');
  const [whatsAppPhoneId, setWhatsAppPhoneId] = useState('');
  const [whatsAppToken, setWhatsAppToken] = useState('');
  
  // Google Calendar Integration states
  const [googleCalendarId, setGoogleCalendarId] = useState('');
  const [googleServiceAccountKey, setGoogleServiceAccountKey] = useState('');

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setOpenRouterKey(localStorage.getItem('setting_openrouter_key') || 'sk-or-v1-jawab-reception');
    setDefaultModel(localStorage.getItem('setting_default_model') || 'meta-llama/llama-3-8b-instruct');
    setWhatsAppPhoneId(localStorage.getItem('setting_whatsapp_phone_id') || '1234567890');
    setWhatsAppToken(localStorage.getItem('setting_whatsapp_token') || 'EAAD...');
    setGoogleCalendarId(localStorage.getItem('setting_google_calendar_id') || 'primary');
    setGoogleServiceAccountKey(localStorage.getItem('setting_google_service_account_key') || '{"type": "service_account", ...}');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    setTimeout(() => {
      localStorage.setItem('setting_openrouter_key', openRouterKey);
      localStorage.setItem('setting_default_model', defaultModel);
      localStorage.setItem('setting_whatsapp_phone_id', whatsAppPhoneId);
      localStorage.setItem('setting_whatsapp_token', whatsAppToken);
      localStorage.setItem('setting_google_calendar_id', googleCalendarId);
      localStorage.setItem('setting_google_service_account_key', googleServiceAccountKey);

      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" onSubmit={handleSave}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1 font-syne text-white">System Settings</h1>
          <p className="text-secondary text-sm">Manage API integrations, WhatsApp Cloud platform, and Google Calendar configurations.</p>
        </div>
        <Button type="submit" className="gap-2 font-bold" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Configuration
        </Button>
      </header>

      {saveSuccess && (
        <div className="p-4 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] text-xs rounded-xl">
          System integration configuration saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI & Intelligence Integration */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-background border border-border rounded-lg text-secondary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-primary">Intelligence & LLM</h2>
              <p className="text-xs text-secondary">LLM reasoning router for answering messages.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">OpenRouter API Key</label>
              <input 
                type="password" 
                value={openRouterKey}
                onChange={(e) => setOpenRouterKey(e.target.value)}
                placeholder="sk-or-v1-..." 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Default Model</label>
              <select 
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
              >
                <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B (Fastest)</option>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-background border border-border rounded-lg text-[#25D366]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-primary">WhatsApp Business API</h2>
              <p className="text-xs text-secondary">Meta Developer Cloud API credentials for automated chats.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">WhatsApp Phone Number ID</label>
              <input 
                type="text" 
                value={whatsAppPhoneId}
                onChange={(e) => setWhatsAppPhoneId(e.target.value)}
                placeholder="1234567890" 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Permanent Access Token</label>
              <input 
                type="password" 
                value={whatsAppToken}
                onChange={(e) => setWhatsAppToken(e.target.value)}
                placeholder="EAAD..." 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* Google Calendar Integration */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-background border border-border rounded-lg text-accent">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-primary">Google Calendar Synchronization</h2>
              <p className="text-xs text-secondary">Synchronize booked customer appointments directly to your Google Calendar.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Google Calendar ID</label>
              <input 
                type="text" 
                value={googleCalendarId}
                onChange={(e) => setGoogleCalendarId(e.target.value)}
                placeholder="primary or calendar-id@group.calendar.google.com" 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Service Account Credentials (JSON)</label>
              <textarea 
                rows={3}
                value={googleServiceAccountKey}
                onChange={(e) => setGoogleServiceAccountKey(e.target.value)}
                placeholder='{"type": "service_account", "project_id": "...", "private_key": "..."}' 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-xs focus:outline-none focus:border-accent text-white font-mono resize-none transition-colors" 
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
