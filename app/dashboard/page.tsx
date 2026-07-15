'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, UserCheck, Calendar, TrendingUp, Loader2, ClipboardList } from 'lucide-react';

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
    whatsapp_sent_at: string | null;
    lead_status: string;
    appointment_date: string | null;
    notes: string | null;
  } | null;
}

export default function DashboardOverview() {
  const router = useRouter();
  const [calls, setCalls] = useState<DBLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const res = await fetch('/api/calls');
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls || []);
        }
      } catch (err) {
        console.error('Failed to load overview logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  // Compute live metrics
  const totalCalls = calls.length; // Repurposed as total chats
  
  const leadsCaptured = calls.filter(
    (c) => c.call_summaries?.customer_name && c.call_summaries.customer_name.trim() !== ''
  ).length;

  const bookedAppointmentsCount = calls.filter(
    (c) => c.call_summaries?.lead_status === 'Appointment Booked'
  ).length;

  const callbackRequests = calls.filter((c) => c.call_summaries?.callback_requested).length;
  const resolutionRateStr = totalCalls > 0
    ? `${Math.round(((totalCalls - callbackRequests) / totalCalls) * 100)}%`
    : '100%';

  // Lead status aggregation
  const leadStatuses = ['New', 'Contacted', 'Appointment Booked', 'Closed'];
  const statusCounts = leadStatuses.reduce((acc, status) => {
    acc[status] = calls.filter(c => (c.call_summaries?.lead_status || 'New') === status).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(statusCounts), 1);

  const stats = [
    { label: 'WhatsApp Chats', value: String(totalCalls), change: 'Live', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'CRM Leads', value: String(leadsCaptured), change: 'Database', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Booked Appointments', value: String(bookedAppointmentsCount), change: 'Active', icon: <Calendar className="w-5 h-5" /> },
    { label: 'Resolution Rate', value: resolutionRateStr, change: 'Optimal', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-secondary">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="text-sm">Loading dynamic overview statistics...</p>
      </div>
    );
  }

  const recentCalls = calls.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight mb-1 text-white font-syne">Dashboard</h1>
        <p className="text-secondary text-sm">Welcome back. Here is what is happening with your WhatsApp automation & CRM today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-background border border-border rounded-lg text-secondary">
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {stat.change}
              </span>
            </div>
            <h3 className="text-3xl font-semibold text-primary mb-1">{stat.value}</h3>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SVG Bar Chart & Customer Personal Logs Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-primary mb-2 font-syne">Lead Status Distribution</h2>
          <p className="text-xs text-secondary mb-6">Current count of leads classified by CRM conversion status stages.</p>
          <div className="h-48 flex items-end justify-between gap-4 px-2 md:px-6 border-b border-border pb-2">
            {leadStatuses.map((status) => {
              const count = statusCounts[status];
              const heightPercent = (count / maxCount) * 80 + 10; // min 10% height for visual balance
              return (
                <div key={status} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-xs font-bold text-accent group-hover:scale-110 transition-transform">
                    {count}
                  </span>
                  <div 
                    className="w-full bg-accent/15 border border-accent/25 rounded-t-lg transition-all duration-300 hover:bg-accent/30 hover:border-accent/40"
                    style={{ height: `${heightPercent}%` }}
                  ></div>
                  <span className="text-[9px] md:text-xs text-secondary font-semibold uppercase tracking-wider truncate max-w-full">
                    {status === 'Appointment Booked' ? 'Booked' : status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer Personal Logs Summary */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="border-b border-border pb-3 mb-3">
            <h2 className="font-semibold text-primary mb-1 font-syne flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-accent" />
              CRM Log Stream
            </h2>
            <p className="text-[10px] text-secondary">Latest internal logs and calendar synchronization notes.</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-44 pr-1 scrollbar-thin">
            {calls.some(c => c.call_summaries?.notes) ? (
              calls
                .filter(c => c.call_summaries?.notes)
                .slice(0, 3)
                .map((call) => (
                  <div key={call.id} className="bg-background border border-border p-2.5 rounded-lg text-xs leading-relaxed">
                    <div className="flex justify-between items-center mb-1 border-b border-border/10 pb-1">
                      <span className="font-bold text-[10px] text-accent font-mono">{call.call_summaries?.customer_name || 'Client'}</span>
                      <span className="text-[8px] text-secondary font-mono">{new Date(call.start_time).toLocaleDateString()}</span>
                    </div>
                    <p className="text-secondary italic text-[11px] leading-relaxed">"{call.call_summaries?.notes}"</p>
                  </div>
                ))
            ) : (
              <div className="text-center py-10 text-xs text-secondary border border-dashed border-border rounded-lg">
                No active calendar notes or CRM logs found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent CRM Activity View */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-primary font-syne">Recent CRM Activity</h2>
          <button onClick={() => router.push('/dashboard/calls')} className="text-xs font-medium text-accent hover:underline">View All Leads</button>
        </div>
        
        <div className="divide-y divide-border">
          {recentCalls.length > 0 ? (
            recentCalls.map((call) => {
              const name = call.call_summaries?.customer_name || 'Unknown Client';
              const phone = call.caller_number;
              const reason = call.call_summaries?.reason_for_call || 'In conversation...';
              const actionRequired = call.call_summaries?.callback_requested || false;
              const leadStatus = call.call_summaries?.lead_status || 'New';
              
              const callDate = new Date(call.start_time);
              const timeStr = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={call.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary mb-0.5">{name}</p>
                      <p className="text-xs text-secondary font-mono">{phone} — {reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary mb-0.5">{timeStr}</p>
                    {actionRequired ? (
                      <div className="flex items-center justify-end gap-1.5 text-xs text-red-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span>Follow-up Req</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-green-400 font-semibold uppercase tracking-wider">{leadStatus}</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-xs text-secondary">
              No recent WhatsApp chats logged. Configure your Meta Webhook to receive live automation inquiries.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
