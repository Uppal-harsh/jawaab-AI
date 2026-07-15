'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, UserCheck, Calendar, TrendingUp, Loader2, ClipboardList, ShieldAlert, ArrowUpCircle, X, Sparkles, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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

  // Trial / Upsell states
  const [trialActive, setTrialActive] = useState(false);
  const [timeRemainingStr, setTimeRemainingStr] = useState('');
  const [trialExpired, setTrialExpired] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [dismissedUpsell, setDismissedUpsell] = useState(false);

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

  // Timer calculation for 7-day trial limits
  useEffect(() => {
    const isTrial = localStorage.getItem('trial_active') === 'true';
    const expiry = localStorage.getItem('trial_expiry');

    if (isTrial && expiry) {
      setTrialActive(true);

      const checkTime = () => {
        const diff = new Date(expiry).getTime() - Date.now();
        if (diff <= 0) {
          setTrialExpired(true);
          setTimeRemainingStr('Expired');
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemainingStr(`${days}d ${hours}h ${mins}m`);

          // Show Warning Banner if less than 24 hours remain
          if (diff <= 24 * 60 * 60 * 1000) {
            setShowWarningBanner(true);
          }
        }
      };

      checkTime();
      const interval = setInterval(checkTime, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  // Upsell trigger evaluation (on day 3 or if 20 leads captured)
  useEffect(() => {
    if (loading) return;
    const expiry = localStorage.getItem('trial_expiry');
    if (!expiry) return;

    // Trigger logic
    const totalLeads = calls.length;

    // 3 days passed = 4 days or less remaining out of 7
    const diff = new Date(expiry).getTime() - Date.now();
    const fourDaysInMs = 4 * 24 * 60 * 60 * 1000;
    const day3Passed = diff <= fourDaysInMs;

    if ((totalLeads >= 20 || day3Passed) && !dismissedUpsell) {
      setShowUpsell(true);
    }
  }, [loading, calls, dismissedUpsell]);

  // Compute live metrics
  const totalCalls = calls.length; 
  
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

  // Lock App if trial is active and has expired
  if (trialActive && trialExpired) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-bold font-syne text-white">Your Trial Ended</h2>
          <p className="text-secondary text-xs">Your 7-day free trial has expired. Upgrade to Starter or Growth tier to restore automated WhatsApp CRM syncing and reactive customer logs.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/pricing')} className="font-bold">Upgrade Now</Button>
          <Button variant="outline" onClick={() => window.location.href = 'mailto:sales@jawab.ai'} className="font-bold">Contact Sales</Button>
        </div>
      </div>
    );
  }

  const recentCalls = calls.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1-Day Expiry Warning Banner */}
      {showWarningBanner && (
        <div className="p-4 bg-red-500/15 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span><strong>Urgent:</strong> Your free trial expires in {timeRemainingStr}. Upgrade to keep AI auto-replies active.</span>
          </div>
          <Button size="sm" className="h-7 text-[10px] font-bold" onClick={() => router.push('/pricing')}>Upgrade Plan</Button>
        </div>
      )}

      {/* Standard Trial Active Header Info */}
      {trialActive && !showWarningBanner && (
        <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-[11px] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Trial Session: <strong>{timeRemainingStr}</strong> remaining.</span>
          </div>
          <button onClick={() => router.push('/pricing')} className="text-xs font-bold hover:underline">Upgrade Plan</button>
        </div>
      )}

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
              const heightPercent = (count / maxCount) * 80 + 10; 
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

      {/* Dynamic Upsell Modal Prompt */}
      {showUpsell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-surface border border-accent/30 rounded-2xl shadow-2xl p-6 flex flex-col text-center space-y-5 animate-in scale-in duration-300">
            <button 
              onClick={() => {
                setShowUpsell(false);
                setDismissedUpsell(true);
              }}
              className="absolute right-4 top-4 text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-accent/15 border border-accent/30 text-accent rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-syne">Upgrade to Growth Tier</h3>
              <p className="text-xs text-secondary leading-relaxed">
                You've hit either your 3-day trial threshold or captured 20+ leads. Upgrade now to secure unlimited AI message responses, full CRM log tracking, and graphic metrics integrations.
              </p>
            </div>

            <div className="bg-background border border-border p-3.5 rounded-xl text-left space-y-1.5 text-xs text-secondary">
              <p className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Unlimited responses</p>
              <p className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Multiple calendar & Sheets syncs</p>
              <p className="flex items-center gap-2"><Check className="w-4 h-4 text-accent" /> Priority chat support & logs exports</p>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setShowUpsell(false);
                  router.push('/pricing');
                }} 
                className="flex-1 justify-center font-bold"
              >
                Upgrade to Growth
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowUpsell(false);
                  setDismissedUpsell(true);
                }} 
                className="flex-1 justify-center font-bold"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
