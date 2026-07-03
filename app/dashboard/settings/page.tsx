'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Save, Globe, Smartphone, Loader2 } from 'lucide-react';

export default function Settings() {
  const [exotelSid, setExotelSid] = useState('');
  const [exotelApiKey, setExotelApiKey] = useState('');
  const [exotelSecret, setExotelSecret] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('meta-llama/llama-3-8b-instruct');
  const [sarvamKey, setSarvamKey] = useState('');
  const [whatsAppPhoneId, setWhatsAppPhoneId] = useState('');
  const [whatsAppToken, setWhatsAppToken] = useState('');

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setExotelSid(localStorage.getItem('setting_exotel_sid') || 'exotel_sid_jawab_mvp');
    setExotelApiKey(localStorage.getItem('setting_exotel_api_key') || '••••••••••••••••');
    setExotelSecret(localStorage.getItem('setting_exotel_secret') || '••••••••••••••••');
    setOpenRouterKey(localStorage.getItem('setting_openrouter_key') || 'sk-or-v1-jawab-reception');
    setDefaultModel(localStorage.getItem('setting_default_model') || 'meta-llama/llama-3-8b-instruct');
    setSarvamKey(localStorage.getItem('setting_sarvam_key') || '••••••••••••••••');
    setWhatsAppPhoneId(localStorage.getItem('setting_whatsapp_phone_id') || '1234567890');
    setWhatsAppToken(localStorage.getItem('setting_whatsapp_token') || 'EAAD...');
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(false);

    setTimeout(() => {
      localStorage.setItem('setting_exotel_sid', exotelSid);
      localStorage.setItem('setting_exotel_api_key', exotelApiKey);
      localStorage.setItem('setting_exotel_secret', exotelSecret);
      localStorage.setItem('setting_openrouter_key', openRouterKey);
      localStorage.setItem('setting_default_model', defaultModel);
      localStorage.setItem('setting_sarvam_key', sarvamKey);
      localStorage.setItem('setting_whatsapp_phone_id', whatsAppPhoneId);
      localStorage.setItem('setting_whatsapp_token', whatsAppToken);

      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 800);
  };

  return (
    <form className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700" onSubmit={handleSave}>
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1">System Settings</h1>
          <p className="text-secondary text-sm">Manage API integrations and core platform configurations.</p>
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
        <div className="p-4 bg-accent/10 border border-accent/20 text-accent text-xs rounded-xl">
          System integration configuration saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telephony Integration */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-background border border-border rounded-lg text-secondary">
              <PhoneIcon />
            </div>
            <div>
              <h2 className="font-medium text-primary">Telephony (Exotel)</h2>
              <p className="text-xs text-secondary">Gateway for incoming calls.</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Account SID</label>
              <input 
                type="text" 
                value={exotelSid}
                onChange={(e) => setExotelSid(e.target.value)}
                placeholder="exotel_sid_..." 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">API Key</label>
              <input 
                type="password" 
                value={exotelApiKey}
                onChange={(e) => setExotelApiKey(e.target.value)}
                placeholder="••••••••••••••••" 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Webhook Secret</label>
              <input 
                type="password" 
                value={exotelSecret}
                onChange={(e) => setExotelSecret(e.target.value)}
                placeholder="••••••••••••••••" 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* AI & Speech Integration */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-background border border-border rounded-lg text-secondary">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-primary">Intelligence & Speech</h2>
              <p className="text-xs text-secondary">LLM routing and STT/TTS providers.</p>
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
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Sarvam AI API Key (Indic Voice)</label>
              <input 
                type="password" 
                value={sarvamKey}
                onChange={(e) => setSarvamKey(e.target.value)}
                placeholder="••••••••••••••••" 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white font-mono transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Integration */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 bg-background border border-border rounded-lg text-secondary">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-medium text-primary">WhatsApp Business API</h2>
              <p className="text-xs text-secondary">Meta Cloud API credentials for sending summary alerts.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">Phone Number ID</label>
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
      </div>
    </form>
  );
}

function PhoneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
