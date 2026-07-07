'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIncoming, UserCheck, Clock, TrendingUp, Loader2 } from 'lucide-react';

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
  const totalCalls = calls.length;
  
  const leadsCaptured = calls.filter(
    (c) => c.call_summaries?.customer_name && c.call_summaries.customer_name.trim() !== ''
  ).length;

  const validDurations = calls.filter((c) => c.duration_seconds !== null) as { duration_seconds: number }[];
  const avgDurationSeconds = validDurations.length > 0 
    ? Math.round(validDurations.reduce((sum, c) => sum + c.duration_seconds, 0) / validDurations.length)
    : 0;
  
  const avgDurationStr = avgDurationSeconds > 0
    ? `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`
    : '0s';

  const callbackRequests = calls.filter((c) => c.call_summaries?.callback_requested).length;
  const recoveryRateStr = totalCalls > 0
    ? `${Math.round(((totalCalls - callbackRequests) / totalCalls) * 100)}%`
    : '100%';

  const stats = [
    { label: 'Total Calls Logged', value: String(totalCalls), change: 'Live', icon: <PhoneIncoming className="w-5 h-5" /> },
    { label: 'Leads Captured', value: String(leadsCaptured), change: 'Database', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Avg Duration', value: avgDurationStr, change: 'Dynamic', icon: <Clock className="w-5 h-5" /> },
    { label: 'Resolution Rate', value: recoveryRateStr, change: 'Optimal', icon: <TrendingUp className="w-5 h-5" /> },
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
        <p className="text-secondary text-sm">Welcome back. Here is what is happening with your reception today.</p>
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

      {/* Recent Calls Minimal View */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-primary">Recent Call Activity</h2>
          <button onClick={() => router.push('/dashboard/calls')} className="text-xs font-medium text-accent hover:underline">View All</button>
        </div>
        
        <div className="divide-y divide-border">
          {recentCalls.length > 0 ? (
            recentCalls.map((call) => {
              const name = call.call_summaries?.customer_name || 'Unknown Caller';
              const phone = call.caller_number;
              const reason = call.call_summaries?.reason_for_call || 'In conversation...';
              const actionRequired = call.call_summaries?.callback_requested || false;
              
              const callDate = new Date(call.start_time);
              const timeStr = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={call.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                      <PhoneIncoming className="w-4 h-4 text-secondary" />
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
                        <span>Callback Req</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-secondary font-semibold uppercase tracking-wider">Resolved</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-xs text-secondary">
              No recent calls logged. Connect your Exotel webhook to forward live traffic.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
