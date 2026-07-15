'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Edit2, Calendar, FileText, CheckCircle, X, Loader2, RefreshCw } from 'lucide-react';
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
    lead_status: string;
    appointment_date: string | null;
    notes: string | null;
  } | null;
}

export default function CRMLeads() {
  const [calls, setCalls] = useState<DBLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Editors
  const [activeTranscriptCall, setActiveTranscriptCall] = useState<DBLogItem | null>(null);
  const [activeEditLead, setActiveEditLead] = useState<DBLogItem | null>(null);
  
  // Edit Form Fields
  const [editStatus, setEditStatus] = useState('New');
  const [editAppointment, setEditAppointment] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCallback, setEditCallback] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

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

  const openEditModal = (call: DBLogItem) => {
    setActiveEditLead(call);
    setEditStatus(call.call_summaries?.lead_status || 'New');
    setEditAppointment(call.call_summaries?.appointment_date || '');
    setEditNotes(call.call_summaries?.notes || '');
    setEditCallback(call.call_summaries?.callback_requested || false);
  };

  const handleSaveLeadDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditLead) return;

    setSaveLoading(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: activeEditLead.id,
          leadStatus: editStatus,
          appointmentDate: editAppointment || null,
          notes: editNotes || null,
          callbackRequested: editCallback
        })
      });

      if (res.ok) {
        setAlertMsg(`CRM Lead details updated successfully for ${activeEditLead.call_summaries?.customer_name || 'Client'}.`);
        setActiveEditLead(null);
        await fetchCalls();
        setTimeout(() => setAlertMsg(null), 3000);
      } else {
        alert('Failed to update lead details.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while updating lead details.');
    } finally {
      setSaveLoading(false);
    }
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
        <p className="text-sm">Retrieving CRM leads & chats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1 text-white font-syne">WhatsApp CRM Leads</h1>
          <p className="text-secondary text-sm">Monitor WhatsApp chats, schedule appointments, and manage client files.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
            <input 
              type="text" 
              placeholder="Search by client name/phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent text-white transition-colors"
            />
          </div>
          <Button variant="outline" size="md" className="gap-2 px-3 font-semibold" onClick={fetchCalls}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </header>

      {/* Dynamic Action Alerts */}
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

      {/* Main CRM Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-background border-b border-border text-secondary">
              <tr>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Customer Details</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">AI Inquiry Summary</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Appointment Info</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Notes</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Lead Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCalls.length > 0 ? (
                filteredCalls.map((call) => {
                  const name = call.call_summaries?.customer_name || 'Unknown Client';
                  const reason = call.call_summaries?.reason_for_call || 'WhatsApp session active';
                  const isUrgent = call.call_summaries?.callback_requested || false;
                  const leadStatus = call.call_summaries?.lead_status || 'New';
                  const appointmentDate = call.call_summaries?.appointment_date || 'Not Scheduled';
                  const notes = call.call_summaries?.notes || 'No internal notes';
                  
                  const callDate = new Date(call.start_time);
                  const timeStr = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = callDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <tr key={call.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-secondary">
                            <MessageSquare className="w-4 h-4 text-[#25D366]" />
                          </div>
                          <div>
                            <p className="font-medium text-primary">{name}</p>
                            <p className="text-xs text-secondary font-mono">{call.caller_number}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[220px] truncate text-secondary">
                        <p className="text-primary truncate">{reason}</p>
                        <p className="text-xs">{dateStr} at {timeStr}</p>
                      </td>
                      <td className="px-6 py-4 text-secondary">
                        <div className="flex items-center gap-1.5 text-xs text-accent">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>{appointmentDate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px] truncate text-xs text-secondary italic">
                        {notes}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            leadStatus === 'Appointment Booked' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : leadStatus === 'Contacted'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : leadStatus === 'Closed'
                              ? 'bg-background border-border text-secondary'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {isUrgent && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse mr-1"></span>}
                            {leadStatus}
                          </span>

                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-8 h-8 p-0 text-secondary hover:text-white" 
                              title="Edit Lead Details"
                              onClick={() => openEditModal(call)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-8 h-8 p-0 text-secondary hover:text-white" 
                              title="View WhatsApp Chat Transcript"
                              onClick={() => setActiveTranscriptCall(call)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-secondary">
                    No CRM leads logged. Connect your Meta WhatsApp webhook to capture automated customer interactions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit CRM Lead Modal */}
      {activeEditLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form onSubmit={handleSaveLeadDetails} className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in scale-in duration-300">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
              <div>
                <h3 className="font-semibold text-white font-syne">Edit CRM Lead Stage</h3>
                <p className="text-xs text-secondary font-mono">
                  {activeEditLead.call_summaries?.customer_name || 'Client'} ({activeEditLead.caller_number})
                </p>
              </div>
              <button 
                type="button"
                onClick={() => setActiveEditLead(null)}
                className="text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Lead Status</label>
                <select 
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white"
                >
                  <option value="New">New Lead</option>
                  <option value="Contacted">Contacted / Open</option>
                  <option value="Appointment Booked">Appointment Booked</option>
                  <option value="Closed">Closed / Completed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Schedule Appointment Date & Time</label>
                <input 
                  type="text" 
                  value={editAppointment}
                  onChange={(e) => setEditAppointment(e.target.value)}
                  placeholder="e.g. tomorrow at 3:00 PM"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary uppercase">Internal Notes</label>
                <textarea 
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Inquire client details, symptoms, pricing discussed..."
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent text-white resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="callback_requested"
                  checked={editCallback}
                  onChange={(e) => setEditCallback(e.target.checked)}
                  className="w-4 h-4 bg-background border-border rounded text-accent focus:ring-0 focus:ring-offset-0"
                />
                <label htmlFor="callback_requested" className="text-xs font-medium text-secondary cursor-pointer">
                  Requires Manual Follow-up / Callback Alert
                </label>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-border bg-background flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveEditLead(null)}>Cancel</Button>
              <Button type="submit" size="sm" className="font-bold" disabled={saveLoading}>
                {saveLoading ? 'Saving...' : 'Save Lead Details'}
              </Button>
            </footer>
          </form>
        </div>
      )}

      {/* Customer Hub Detail Modal */}
      {activeTranscriptCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-3xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in scale-in duration-300">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-background">
              <div>
                <h3 className="font-semibold text-white font-syne">Customer Details & Conversation Hub</h3>
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

            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 overflow-hidden">
              {/* Left Column: Chat Transcript */}
              <div className="md:col-span-3 overflow-y-auto p-6 space-y-4 bg-background/30 border-r border-border flex flex-col justify-between max-h-[55vh] md:max-h-none">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-2">WhatsApp Conversation History</h4>
                  {activeTranscriptCall.call_summaries?.full_transcript && 
                  activeTranscriptCall.call_summaries.full_transcript.length > 0 ? (
                    activeTranscriptCall.call_summaries.full_transcript.map((line, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
                          line.role === 'user'
                            ? 'bg-[#222] text-secondary self-start'
                            : 'bg-[#075e54] text-white self-end border border-[#075e54]'
                        }`}
                      >
                        <span className="font-bold text-[9px] uppercase tracking-wider mb-1 text-white opacity-70">
                          {line.role === 'user' ? 'Client' : 'Jawaab AI Agent'}
                        </span>
                        {line.content}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-secondary text-center py-4">No WhatsApp messages recorded in this session.</p>
                  )}
                </div>
              </div>

              {/* Right Column: CRM Profile Log & Sync Timeline */}
              <div className="md:col-span-2 overflow-y-auto p-6 space-y-5 bg-background/10">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-3">Customer Profile Info</h4>
                  <div className="bg-background border border-border p-3.5 rounded-xl space-y-2 text-xs">
                    <p className="text-secondary"><strong>Name:</strong> {activeTranscriptCall.call_summaries?.customer_name || 'Not Provided'}</p>
                    <p className="text-secondary"><strong>Phone:</strong> {activeTranscriptCall.caller_number}</p>
                    <p className="text-secondary">
                      <strong>Lead Stage:</strong> 
                      <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/15 border border-accent/20 text-accent uppercase">
                        {activeTranscriptCall.call_summaries?.lead_status || 'New'}
                      </span>
                    </p>
                    <p className="text-secondary"><strong>Appointment Slot:</strong> {activeTranscriptCall.call_summaries?.appointment_date || 'None Scheduled'}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-secondary mb-3">CRM Activity Timeline</h4>
                  <div className="relative border-l border-border pl-4 ml-2 space-y-4 text-xs">
                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-green-500"></span>
                      <p className="font-semibold text-primary">Inquiry Session Created</p>
                      <p className="text-[10px] text-secondary">{new Date(activeTranscriptCall.start_time).toLocaleString()}</p>
                    </div>

                    <div className="relative">
                      <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-accent"></span>
                      <p className="font-semibold text-primary">Calendar & Status Details</p>
                      <p className="text-[10px] text-secondary italic">
                        {activeTranscriptCall.call_summaries?.notes || 'No active synchronization logs recorded.'}
                      </p>
                    </div>

                    {activeTranscriptCall.call_summaries?.appointment_date && (
                      <div className="relative">
                        <span className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                        <p className="font-semibold text-primary">Google Calendar Event Booked</p>
                        <p className="text-[10px] text-secondary">Reserved at: {activeTranscriptCall.call_summaries.appointment_date}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 border-t border-border bg-background flex justify-between">
              <Button 
                variant="outline" 
                size="sm" 
                className="font-bold" 
                onClick={() => {
                  setActiveTranscriptCall(null);
                  openEditModal(activeTranscriptCall);
                }}
              >
                Edit CRM Details
              </Button>
              <Button size="sm" className="font-bold" onClick={() => setActiveTranscriptCall(null)}>Close Hub</Button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
