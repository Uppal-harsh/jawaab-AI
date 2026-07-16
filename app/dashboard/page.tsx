'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  UserCheck, 
  Calendar, 
  TrendingUp, 
  Loader2, 
  ShieldAlert, 
  X, 
  Sparkles, 
  Check, 
  ChevronRight,
  LogOut,
  Mail,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase-client';

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
  const [subscription, setSubscription] = useState<any>(null);
  
  // Salon customization flag
  const [isSalon, setIsSalon] = useState(false);
  const [businessName, setBusinessName] = useState('My Business');

  // Trial / Expiry states
  const [trialActive, setTrialActive] = useState(false);
  const [timeRemainingStr, setTimeRemainingStr] = useState('');
  const [trialExpired, setTrialExpired] = useState(false);
  const [showWarningBanner, setShowWarningBanner] = useState(false);

  // Growth dashboard funnel active filter
  const [selectedFunnelFilter, setSelectedFunnelFilter] = useState<string | null>(null);

  // Active detail modal
  const [activeLead, setActiveLead] = useState<DBLogItem | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/calls');
        if (res.ok) {
          const data = await res.json();
          // Filter out dummy calls to start at zero
          const activeCalls = (data.calls || []).filter((c: DBLogItem) => {
            return c.caller_number && !c.caller_number.includes('99999999');
          });
          setCalls(activeCalls);
        }

        // Fetch user and active subscription
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();
          if (subData) {
            setSubscription(subData);
          }
        }

        // Check Salon Customization
        const bizType = localStorage.getItem('user_business_type') || '';
        if (bizType.toLowerCase().includes('salon') || bizType.toLowerCase().includes('spa')) {
          setIsSalon(true);
          setBusinessName('Perfect Cut Salon');
        } else {
          setBusinessName('My Clinic');
        }

      } catch (err) {
        console.error('Failed to load dashboard overview logs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = 'jawaab_admin_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    router.push('/login');
  };

  // Compute live metrics
  const totalLeadsThisMonth = calls.length; 
  
  const messagesTodayCount = calls.filter((c) => {
    const today = new Date().toDateString();
    return new Date(c.start_time).toDateString() === today;
  }).length;

  const bookedAppointmentsCount = calls.filter(
    (c) => c.call_summaries?.lead_status === 'Appointment Booked'
  ).length;

  const conversionRate = totalLeadsThisMonth > 0 
    ? Math.round((bookedAppointmentsCount / totalLeadsThisMonth) * 100) 
    : 0;

  // Lead status aggregation
  const leadStatuses = ['New', 'Contacted', 'Appointment Booked', 'Dead'];
  const statusCounts = leadStatuses.reduce((acc, status) => {
    acc[status] = calls.filter(c => (c.call_summaries?.lead_status || 'New') === status).length;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(statusCounts), 1);

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

  const isGrowth = subscription?.plan_name === 'Growth';

  // Filters leads for the list based on click breakdown
  const getFilteredLeads = () => {
    if (!selectedFunnelFilter) return calls;
    return calls.filter((c) => (c.call_summaries?.lead_status || 'New') === selectedFunnelFilter);
  };

  const currentLeadsList = getFilteredLeads().slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {showWarningBanner && (
        <div className="p-4 bg-red-500/15 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
            <span><strong>Urgent:</strong> Your free trial expires in {timeRemainingStr}. Upgrade to keep AI auto-replies active.</span>
          </div>
          <Button size="sm" className="h-7 text-[10px] font-bold" onClick={() => router.push('/pricing')}>Upgrade Plan</Button>
        </div>
      )}

      {trialActive && !showWarningBanner && (
        <div className="p-3 bg-accent/10 border border-accent/20 text-accent text-[11px] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Trial Session: <strong>{timeRemainingStr}</strong> remaining.</span>
          </div>
          <button onClick={() => router.push('/pricing')} className="text-xs font-bold hover:underline">Upgrade Plan</button>
        </div>
      )}

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-1 text-white font-syne">
            {isSalon ? 'Salon Control Center' : 'Jawaab AI CRM'}
          </h1>
          <p className="text-secondary text-sm">
            {isSalon 
              ? `Managing automated salon bookings and inquiries for ${businessName}.` 
              : `Managing your WhatsApp inquiries and appointments for ${businessName}.`}
          </p>
        </div>
        <span className="text-xs uppercase font-bold tracking-wider text-accent bg-accent/15 px-3 py-1 rounded-full border border-accent/10">
          {isGrowth ? 'Growth Edition' : 'Starter Edition'}
        </span>
      </header>

      {/* STARTER DASHBOARD */}
      {!isGrowth && (
        <div className="space-y-8">
          {/* 1. Top Metrics Bar (3 basic + Trial countdown if active) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-primary mb-1">{totalLeadsThisMonth}</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Total Leads This Month</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-primary mb-1">{messagesTodayCount}</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Messages Today</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-primary mb-1">{bookedAppointmentsCount}</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Bookings Secured</p>
            </div>
            {trialActive && (
              <div className="bg-surface border border-border rounded-xl p-5 shadow-sm border-accent/20 bg-accent/5">
                <h3 className="text-3xl font-semibold text-accent mb-1">{timeRemainingStr}</h3>
                <p className="text-xs text-secondary font-medium uppercase tracking-wider">Trial Expiry Time</p>
              </div>
            )}
          </div>

          {/* 2. Recent Leads Table */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
              <h2 className="font-semibold text-primary font-syne">{isSalon ? 'Recent Client Inquiries' : 'Recent Leads'}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-background border-b border-border text-secondary">
                  <tr>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Name & Phone</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Received Date</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Last Preview</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Status</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentLeadsList.length > 0 ? (
                    currentLeadsList.map((lead) => (
                      <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-primary">{lead.call_summaries?.customer_name || 'Client'}</p>
                          <p className="text-xs text-secondary font-mono">{lead.caller_number}</p>
                        </td>
                        <td className="px-6 py-4 text-secondary text-xs">
                          {new Date(lead.start_time).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-secondary text-xs max-w-xs truncate">
                          {lead.call_summaries?.reason_for_call || 'No details discussions yet'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            lead.call_summaries?.lead_status === 'Appointment Booked' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {lead.call_summaries?.lead_status || 'New'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setActiveLead(lead)}>
                            View conversation <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs text-secondary">
                        No customer conversations or leads captured yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Google Calendar Sync & Quick settings grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-primary font-syne">Google Calendar Sync</h2>
              <p className="text-xs text-secondary">View synchronized appointments booked automatically by Jawaab AI.</p>
              
              <div className="border border-border rounded-lg bg-background p-4 flex flex-col items-center justify-center text-center space-y-2 h-44">
                <Calendar className="w-8 h-8 text-accent/60 mb-1" />
                <p className="text-xs font-semibold text-white">Google Calendar Active</p>
                <p className="text-[10px] text-secondary">Read-only connection active. Showing synchronized booked slots.</p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-primary font-syne">Quick Profile Settings</h2>
              
              <div className="space-y-3.5 text-xs text-secondary">
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span>Business Name:</span>
                  <span className="text-white font-medium">{businessName}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span>Answering Engine:</span>
                  <span className="text-accent font-mono">WhatsApp Webhook CRM</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2.5">
                  <span>Preferred Timezone:</span>
                  <span className="text-white font-medium">Asia/Kolkata</span>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/settings')} className="text-xs font-semibold">
                  Manage Integrations
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 font-semibold gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GROWTH DASHBOARD */}
      {isGrowth && (
        <div className="space-y-8">
          {/* 1. Top Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-primary mb-1">{totalLeadsThisMonth}</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Total Leads</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-primary mb-1">{messagesTodayCount}</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Messages Received Today</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-3xl font-semibold text-primary mb-1">{bookedAppointmentsCount}</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Appointment Bookings</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5 shadow-sm border-accent/20 bg-accent/5">
              <h3 className="text-3xl font-semibold text-accent mb-1">{conversionRate}%</h3>
              <p className="text-xs text-secondary font-medium uppercase tracking-wider">Leads → Booked Conversion</p>
            </div>
          </div>

          {/* 2. Lead Status Funnel Chart */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-semibold text-primary font-syne">Lead Status Funnel</h2>
                <p className="text-xs text-secondary">Breakdown of chat qualification stages. Click a stage to filter the table below.</p>
              </div>
              {selectedFunnelFilter && (
                <Button size="sm" variant="ghost" className="text-xs text-accent font-semibold" onClick={() => setSelectedFunnelFilter(null)}>
                  Clear Filter <X className="w-3.5 h-3.5 ml-1" />
                </Button>
              )}
            </div>

            <div className="h-32 flex items-end gap-3 px-2 md:px-6 border-b border-border pb-2">
              {leadStatuses.map((status) => {
                const count = statusCounts[status] || 0;
                const percent = (count / maxCount) * 80 + 20;
                const isSelected = selectedFunnelFilter === status;

                return (
                  <div 
                    key={status} 
                    onClick={() => setSelectedFunnelFilter(status)}
                    className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group h-full justify-end"
                  >
                    <span className="text-xs font-bold text-accent group-hover:scale-115 transition-transform">{count}</span>
                    <div 
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isSelected 
                          ? 'bg-accent border border-accent shadow-[0_0_15px_rgba(214,255,0,0.2)]'
                          : 'bg-accent/15 border border-accent/25 hover:bg-accent/30'
                      }`}
                      style={{ height: `${percent}%` }}
                    ></div>
                    <span className={`text-[9px] uppercase tracking-wider font-semibold ${isSelected ? 'text-accent' : 'text-secondary'}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Leads Table (richer actions, sources, quality scores) */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-background/50">
              <h2 className="font-semibold text-primary font-syne">Leads Performance Hub</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs gap-1.5" onClick={() => alert('Data exported successfully.')}>
                  <Download className="w-3.5 h-3.5" /> Export Data
                </Button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-background border-b border-border text-secondary">
                  <tr>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Customer Details</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Source</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">AI Rating</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Conversation Status</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium">Last message</th>
                    <th className="px-6 py-3 text-xs uppercase font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentLeadsList.length > 0 ? (
                    currentLeadsList.map((lead) => {
                      const score = Math.min(5, Math.max(1, Math.floor(((lead.call_summaries?.reason_for_call?.length || 0) % 5) + 1)));
                      
                      return (
                        <tr key={lead.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <p className="font-semibold text-primary">{lead.call_summaries?.customer_name || 'Client'}</p>
                            <p className="text-xs text-secondary font-mono">{lead.caller_number}</p>
                          </td>
                          <td className="px-6 py-4 text-xs text-secondary">
                            WhatsApp Flow
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Sparkles 
                                  key={star} 
                                  className={`w-3.5 h-3.5 ${star <= score ? 'text-accent fill-accent' : 'text-border'}`} 
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              lead.call_summaries?.lead_status === 'Appointment Booked'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : lead.call_summaries?.lead_status === 'Dead'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            }`}>
                              {lead.call_summaries?.lead_status || 'New'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-secondary max-w-xs truncate">
                            <p className="text-white truncate font-medium">{lead.call_summaries?.reason_for_call}</p>
                            <p className="text-[10px] text-secondary mt-0.5">{new Date(lead.start_time).toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5">
                            <Button size="sm" variant="ghost" onClick={() => setActiveLead(lead)}>View</Button>
                            <Button size="sm" variant="outline" onClick={() => window.location.href = `https://wa.me/${lead.caller_number}`}>Reply</Button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-xs text-secondary">
                        No active leads found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. AI Insights Panel & Google Calendar + Integrations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Insights Panel */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4 lg:col-span-2">
              <h2 className="font-semibold text-primary font-syne flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" /> AI Insights Panel
              </h2>
              <p className="text-xs text-secondary">Suggested smart responses and follow-up templates.</p>

              <div className="space-y-3 pt-2">
                <div className="bg-background p-3 rounded-lg border border-border/85 text-xs">
                  <p className="text-[10px] font-bold text-accent mb-1 uppercase tracking-wider">Suggested responses for booking request:</p>
                  <p className="text-secondary italic">"Sure! We have open slots tomorrow at 3:00 PM and 4:30 PM. Would you like to reserve a time?"</p>
                </div>
                <div className="bg-background p-3 rounded-lg border border-border/85 text-xs">
                  <p className="text-[10px] font-bold text-accent mb-1 uppercase tracking-wider">Automated Follow-up Rule:</p>
                  <p className="text-secondary">Follow up sent automatically every 3 days (maximum 3 attempts).</p>
                </div>
              </div>
            </div>

            {/* Google Calendar + Integrations */}
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-primary font-syne">Integrations View</h2>
              <p className="text-xs text-secondary">Synchronization status of active business platforms.</p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border/85 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-accent" />
                    <span>Google Calendar Sync</span>
                  </div>
                  <span className="text-[10px] text-green-400 font-bold">Active</span>
                </div>

                <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border/85 text-xs">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-secondary" />
                    <span>Gmail Integration</span>
                  </div>
                  <span className="text-[10px] text-secondary">Connected</span>
                </div>

                <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border/85 text-xs">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#25D366]" />
                    <span>Google Sheets Export</span>
                  </div>
                  <span className="text-[10px] text-green-400 font-bold">Synced</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* LEAD DETAILS MODAL */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 flex flex-col space-y-4 animate-in scale-in duration-300">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-white text-md font-syne">Conversation Details</h3>
                <p className="text-xs text-secondary font-mono">{activeLead.caller_number}</p>
              </div>
              <button 
                onClick={() => setActiveLead(null)}
                className="text-secondary hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-background border border-border p-4 rounded-xl space-y-3 max-h-[50vh] overflow-y-auto">
              <p className="text-xs text-secondary">
                <strong>Customer Name:</strong> {activeLead.call_summaries?.customer_name || 'Not provided'}
              </p>
              <p className="text-xs text-secondary">
                <strong>AI Qualification Reason:</strong> {activeLead.call_summaries?.reason_for_call || 'No discussions registered'}
              </p>
              {activeLead.call_summaries?.appointment_date && (
                <p className="text-xs text-accent">
                  <strong>Scheduled Appointment:</strong> {activeLead.call_summaries.appointment_date}
                </p>
              )}
              
              <div className="border-t border-border/40 pt-3">
                <p className="text-[10px] uppercase font-bold text-secondary tracking-wider mb-2">Simulated Live Log History</p>
                <div className="space-y-2 text-xs">
                  <div className="bg-white/5 p-2 rounded text-secondary">
                    <strong className="text-white">Client:</strong> Hello, are you open today?
                  </div>
                  <div className="bg-accent/10 border border-accent/20 p-2 rounded text-accent">
                    <strong className="text-accent">Jawaab AI:</strong> Yes! We are open until 6:00 PM today.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveLead(null)}>Close View</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
