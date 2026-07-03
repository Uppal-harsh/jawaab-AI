'use client';

import React, { useState } from 'react';
import { PhoneIncoming, Search, Filter, PlayCircle, MessageSquare, X, Check, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const mockCalls = [
  { 
    id: 1, 
    name: 'Rahul', 
    phone: '+91 98200 12345', 
    reason: 'Weekend appointment', 
    status: 'Callback Requested', 
    duration: '1m 24s', 
    time: '10:42 AM', 
    isUrgent: true,
    transcript: [
      { role: 'user', content: 'Namaste, do you have appointments open this Saturday?' },
      { role: 'assistant', content: 'Namaste. Yes, we have a slot open at 4:00 PM this Saturday. Can I lock that in for you?' },
      { role: 'user', content: 'Yes, please book it under Rahul.' },
      { role: 'assistant', content: 'Done, Rahul. I will alert the doctor. We will call you back shortly to confirm.' }
    ]
  },
  { 
    id: 2, 
    name: 'Anjali', 
    phone: '+91 98345 67890', 
    reason: 'Root canal pricing', 
    status: 'Resolved', 
    duration: '45s', 
    time: '09:15 AM', 
    isUrgent: false,
    transcript: [
      { role: 'user', content: 'Hello, what is the cost for a general root canal treatment?' },
      { role: 'assistant', content: 'Hello. Our general consultation is ₹500, and root canal treatments typically start from ₹4,500 depending on complexity. Would you like to schedule a consultation?' },
      { role: 'user', content: 'Okay, I will check and call back. Thank you.' },
      { role: 'assistant', content: 'You are welcome. Have a smiling day!' }
    ]
  },
  { 
    id: 3, 
    name: 'Unknown', 
    phone: '+91 99887 76655', 
    reason: 'Location inquiry', 
    status: 'Resolved', 
    duration: '30s', 
    time: 'Yesterday', 
    isUrgent: false,
    transcript: [
      { role: 'user', content: 'Where is your clinic located?' },
      { role: 'assistant', content: 'We are located at Sector 5, HSR Layout, Bangalore, right next to the central park.' },
      { role: 'user', content: 'Thanks, got it.' }
    ]
  },
];

export default function CallLogs() {
  const [calls, setCalls] = useState(mockCalls);
  const [activeTranscriptCall, setActiveTranscriptCall] = useState<typeof mockCalls[0] | null>(null);
  const [playingCallId, setPlayingCallId] = useState<number | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const triggerPlayAudio = (call: typeof mockCalls[0]) => {
    // If browser supports SpeechSynthesis, read out the assistant greeting as a mock recording!
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPlayingCallId(call.id);
      
      const utterance = new SpeechSynthesisUtterance(call.transcript[0]?.content || "Playing voice recording.");
      utterance.rate = 0.95;
      utterance.onend = () => setPlayingCallId(null);
      window.speechSynthesis.speak(utterance);
      
      setAlertMsg(`Playing call recording for ${call.name || 'caller'}...`);
      setTimeout(() => setAlertMsg(null), 3000);
    } else {
      alert(`Mock Audio Playback started for call: ${call.phone}`);
    }
  };

  const triggerWhatsAppAlert = (call: typeof mockCalls[0]) => {
    setAlertMsg(`Summary payload successfully sent to WhatsApp receiver (+91 98765 43210) for ${call.name}.`);
    setTimeout(() => setAlertMsg(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1 text-white font-syne">Call Logs</h1>
          <p className="text-secondary text-sm">Review AI conversations and captured leads.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="text" 
              placeholder="Search phone number..." 
              className="w-full sm:w-64 bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
            />
          </div>
          <Button variant="outline" size="md" className="gap-2 px-3 font-semibold">
            <Filter className="w-4 h-4" /> <span className="hidden sm:inline">Filter</span>
          </Button>
        </div>
      </header>

      {/* Interactive Alert Banner */}
      {alertMsg && (
        <div className="p-3 bg-accent/15 border border-accent/20 text-accent text-xs rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <button onClick={() => setAlertMsg(null)} className="text-secondary hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background border-b border-border text-secondary">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Caller Info</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Summary</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Duration & Time</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-secondary">
                        <PhoneIncoming className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-primary">{call.name}</p>
                        <p className="text-xs text-secondary font-mono">{call.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-secondary">
                    {call.reason}
                  </td>
                  <td className="px-6 py-4 text-secondary">
                    <p className="text-primary">{call.duration}</p>
                    <p className="text-xs">{call.time}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      call.isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-background border border-border text-secondary'
                    }`}>
                      {call.isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`w-8 h-8 p-0 ${playingCallId === call.id ? 'text-accent' : 'text-secondary hover:text-white'}`}
                        title="Play Recording"
                        onClick={() => triggerPlayAudio(call)}
                      >
                        <PlayCircle className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-8 h-8 p-0 text-secondary hover:text-white" 
                        title="View Transcript"
                        onClick={() => setActiveTranscriptCall(call)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 text-xs bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 border-none font-bold"
                        onClick={() => triggerWhatsAppAlert(call)}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcript Modal */}
      {activeTranscriptCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in scale-in duration-300">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
              <div>
                <h3 className="font-semibold text-white font-syne">Voice Conversation Log</h3>
                <p className="text-xs text-secondary font-mono">{activeTranscriptCall.name} ({activeTranscriptCall.phone})</p>
              </div>
              <button 
                onClick={() => setActiveTranscriptCall(null)}
                className="text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTranscriptCall.transcript.map((line, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[80%] p-3 rounded-lg text-xs leading-relaxed ${
                    line.role === 'user'
                      ? 'bg-[#222] text-secondary self-start'
                      : 'bg-accent/10 text-accent self-end border border-accent/10'
                  }`}
                >
                  <span className="font-bold text-[9px] uppercase tracking-wider mb-1 text-white">
                    {line.role === 'user' ? 'Caller' : 'Jawab AI'}
                  </span>
                  {line.content}
                </div>
              ))}
            </div>

            <footer className="px-6 py-4 border-t border-border bg-background flex justify-end">
              <Button size="sm" className="font-bold" onClick={() => setActiveTranscriptCall(null)}>Close Transcript</Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
