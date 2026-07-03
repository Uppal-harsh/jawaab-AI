'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase-client';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { ShieldCheck, Mail, Lock, Chrome, Loader2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Notification states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (activeTab === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        if (data.session) {
          // Store a temporary local session cookie if our backend API checks it
          document.cookie = `jawaab_admin_session=authenticated_token_active; path=/; max-age=604800; samesite=strict;`;
          router.push('/dashboard');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          }
        });

        if (error) throw error;

        // If email confirmation is enabled, notify the user. Otherwise redirect.
        if (data.session) {
          document.cookie = `jawaab_admin_session=authenticated_token_active; path=/; max-age=604800; samesite=strict;`;
          router.push('/dashboard');
        } else {
          setSuccessMsg('Account created! Please check your email for the confirmation link.');
          setEmail('');
          setPassword('');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect with Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background Decorative Radial Glows */}
      <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[5%] w-[45%] h-[45%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(255,255,255,0.01)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo size="lg" className="mb-2" />
          <p className="text-secondary text-sm max-w-xs">
            Log in to manage your AI voice receptionist and capture every customer lead.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="bg-surface border border-border p-1 rounded-lg flex items-center">
          <button
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'signin'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-secondary hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 text-center py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'signup'
                ? 'bg-accent/10 text-accent border border-accent/20'
                : 'text-secondary hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-2xl relative">
          
          {/* Notifications */}
          {errorMsg && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg flex items-start gap-2">
              <span className="font-semibold">Error:</span> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 bg-accent/10 border border-accent/20 text-accent text-xs py-2.5 px-3 rounded-lg">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-white"
                  required
                />
                <Mail className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-secondary uppercase tracking-wider block">
                  Password
                </label>
                {activeTab === 'signin' && (
                  <a href="#" className="text-[10px] text-accent hover:underline">
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors text-white"
                  required
                />
                <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-3" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full justify-center gap-2 mt-2 h-10 font-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please Wait
                </>
              ) : activeTab === 'signin' ? (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <span className="relative px-3 text-[10px] uppercase text-secondary bg-surface font-semibold tracking-widest">
              Or Connect With
            </span>
          </div>

          {/* Google Auth Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full justify-center gap-2 h-10 text-white border border-border bg-background hover:bg-white/5 font-semibold"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Chrome className="w-4 h-4" />
            )}
            Continue with Google
          </Button>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-secondary">
          <ShieldCheck className="w-4 h-4 text-accent" />
          <span>Secured by Supabase Authentication</span>
        </div>
      </div>
    </div>
  );
}
