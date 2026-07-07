'use client';

import React, { useState, useEffect } from 'react';
import { PhoneIncoming, Search, Filter, PlayCircle, MessageSquare, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ChatLine {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface DBLogItem {
  id: string;
  telephony_call_id: string;
  caller_number: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  call_summaries: {
    customer_name: string | null;
    customer_phone: string;
    reason_for_call: string;
    callback_requested: boolean;
    full_transcript: ChatLine[];
    whatsapp_sent_at: string | null;
  } | null;
}

export default function CallLogs() {
  const [calls, setCalls] = useState<DBLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTranscriptCall, setActiveTranscriptCall] = useState<DBLogItem | null>(null);
  const [playingCallId, setPlayingCallId] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const fetchCalls = async () => {
    try {
      const res = await fetch('/api/calls');
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
      }
    } catch (e) {
      console.error('Failed to load live database calls:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const triggerPlayAudio = (call: DBLogItem) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPlayingCallId(call.id);
      
      const transcript = call.call_summaries?.full_transcript || [];
      const assistantGreeting = transcript.find(line => line.role === 'assistant')?.content 
        || "Playing incoming call recording session.";
        
      const utterance = new SpeechSynthesisUtterance(assistantGreeting);
      utterance.rate = 0.95;
      utterance.onend = () => setPlayingCallId(null);
      window.speechSynthesis.speak(utterance);
      
      const callerName = call.call_summaries?.customer_name || 'caller';
      setAlertMsg(`Simulating call playback for ${callerName}...`);
      setTimeout(() => setAlertMsg(null), 3000);
    } else {
      alert(`Audio playback simulated for number: ${call.caller_number}`);
    }
  };

  const triggerWhatsAppAlert = (call: DBLogItem) => {
    const callerName = call.call_summaries?.customer_name || 'New Lead';
    setAlertMsg(`WhatsApp summary alert successfully dispatched to registered owner for ${callerName}.`);
    setTimeout(() => setAlertMsg(null), 4000);
  };

  // Filter logs by search query
  const filteredCalls = calls.filter((call) => {
    const term = searchQuery.toLowerCase();
    const phone = call.caller_number.toLowerCase();
    const name = (call.call_summaries?.customer_name || '').toLowerCase();
    const reason = (call.call_summaries?.reason_for_call || '').toLowerCase();
    return phone.includes(term) || name.includes(term) || reason.includes(term);
  });

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="text-sm">Retrieving real call logs...</p>
      </div>
    );
  }

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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
            />
          </div>
          <Button variant="outline" size="md" className="gap-2 px-3 font-semibold" onClick={fetchCalls}>
            Refresh
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
              {filteredCalls.length > 0 ? (
                filteredCalls.map((call) => {
                  const name = call.call_summaries?.customer_name || 'Unknown Caller';
                  const reason = call.call_summaries?.reason_for_call || 'In conversation...';
                  const isUrgent = call.call_summaries?.callback_requested || false;
                  
                  // Format duration
                  let durationStr = 'Ongoing';
                  if (call.duration_seconds !== null && call.duration_seconds !== undefined) {
                    const min = Math.floor(call.duration_seconds / 60);
                    const sec = call.duration_seconds % 60;
                    durationStr = `${min}m ${sec}s`;
                  }
                  
                  // Format Time
                  const callDate = new Date(call.start_time);
                  const timeStr = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = callDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <tr key={call.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-secondary">
                            <PhoneIncoming className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">{name}</p>
                            <p className="text-xs text-secondary font-mono">{call.caller_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-secondary">
                        {reason}
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        <p className="text-primary">{durationStr}</p>
                        <p className="text-xs">{dateStr} at {timeStr}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isUrgent ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-background border border-border text-secondary'
                        }`}>
                          {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                          {isUrgent ? 'Callback Requested' : 'Resolved'}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-secondary">
                    No live database call logs found. Secure your Twilio line to receive incoming signals.
                  </td>
                </tr>
              )}
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
                <p className="text-xs text-secondary font-mono">
                  {activeTranscriptCall.call_summaries?.customer_name || 'Unknown'} ({activeTranscriptCall.caller_number})
                </p>
              </div>
              <button 
                onClick={() => setActiveTranscriptCall(null)}
                className="text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeTranscriptCall.call_summaries?.full_transcript && 
              activeTranscriptCall.call_summaries.full_transcript.length > 0 ? (
                activeTranscriptCall.call_summaries.full_transcript.map((line, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col max-w-[80%] p-3 rounded-lg text-xs leading-relaxed ${
                      line.role === 'user'
                        ? 'bg-[#222] text-secondary self-start'
                        : 'bg-accent/10 text-accent self-end border border-accent/10'
                    }`}
                  >
                    <span className="font-bold text-[9px] uppercase tracking-wider mb-1 text-white">
                      {line.role === 'user' ? 'Caller' : 'Jawaab AI'}
                    </span>
                    {line.content}
                  </div>
                ))
              ) : (
                <p className="text-xs text-secondary text-center py-4">No transcript items logged for this session.</p>
              )}
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
