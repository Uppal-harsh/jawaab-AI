'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIncoming, UserCheck, Clock, TrendingUp } from 'lucide-react';

const stats = [
  { label: 'Total Calls Today', value: '24', change: '+12%', icon: <PhoneIncoming className="w-5 h-5" /> },
  { label: 'Leads Captured', value: '18', change: '+8%', icon: <UserCheck className="w-5 h-5" /> },
  { label: 'Avg Duration', value: '1m 12s', change: '-5s', icon: <Clock className="w-5 h-5" /> },
  { label: 'Recovery Rate', value: '75%', change: '+2%', icon: <TrendingUp className="w-5 h-5" /> },
];

export default function DashboardOverview() {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight mb-1">Dashboard</h1>
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
              <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
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
          {[1, 2, 3].map((item) => (
            <div key={item} className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center">
                  <PhoneIncoming className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-primary mb-0.5">+91 98765 43210</p>
                  <p className="text-xs text-secondary">Asking about weekend appointments</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary mb-0.5">10:42 AM</p>
                <div className="flex items-center justify-end gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  <span className="text-secondary">Action Required</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
