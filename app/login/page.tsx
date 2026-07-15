'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase-client';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Mail, Lock, Chrome, Loader2, Smartphone, KeyRound, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Intercept phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [verificationStep, setVerificationStep] = useState(1); // 1: Phone input, 2: OTP entry, 3: Success
  const [phoneInput, setPhoneInput] = useState('+91');
  const [otpInput, setOtpInput] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // Notification states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const checkPhoneVerificationStatus = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/auth/phone-check?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        return data.verified;
      }
    } catch (e) {
      console.error('[Verification Check Error]:', e);
    }
    return false;
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setActiveUserId(session.user.id);
        const isVerified = await checkPhoneVerificationStatus(session.user.id);
        if (isVerified) {
          // Set session cookie
          document.cookie = `jawaab_admin_session=authenticated_token_active; path=/; max-age=604800; samesite=strict;`;
          
          const { data: pref } = await supabase
            .from('onboarding_preferences')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (pref) {
            router.push('/dashboard');
          } else {
            router.push('/onboarding');
          }
        } else {
          // Lock layout and force verification
          setShowPhoneVerification(true);
        }
      }
    };
    checkUser();
  }, [router]);

  // Check URL params for signup mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'signup') {
      setActiveTab('signup');
    }
  }, []);

  // Timer countdown for Resend OTP button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showPhoneVerification && verificationStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showPhoneVerification, verificationStep, resendTimer]);

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
          setActiveUserId(data.session.user.id);
          const isVerified = await checkPhoneVerificationStatus(data.session.user.id);
          
          if (isVerified) {
            document.cookie = `jawaab_admin_session=authenticated_token_active; path=/; max-age=604800; samesite=strict;`;
            
            const { data: pref } = await supabase
              .from('onboarding_preferences')
              .select('id')
              .eq('user_id', data.session.user.id)
              .maybeSingle();

            if (pref) {
              router.push('/dashboard');
            } else {
              router.push('/onboarding');
            }
          } else {
            // Lock and show OTP screen
            setShowPhoneVerification(true);
            setVerificationStep(1);
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          }
        });

        if (error) throw error;

        if (data.session) {
          setActiveUserId(data.session.user.id);
          setShowPhoneVerification(true);
          setVerificationStep(1);
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
          redirectTo: `${window.location.origin}/login`, // Redirect back to login page to intercept and check phone verification
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not connect with Google.');
      setGoogleLoading(false);
    }
  };

  // OTP Verification flow submissions
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput || !phoneInput.startsWith('+') || phoneInput.length < 10) {
      setErrorMsg('Please enter a valid phone number with country code (e.g. +91...)');
      return;
    }

    setOtpLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }

      if (data.simulated && data.debugCode) {
        console.warn(`[DEV MODE] OTP: ${data.debugCode}`);
        alert(`[DEV MODE] Twilio mock OTP: ${data.debugCode}`);
      }

      setResendTimer(30);
      setVerificationStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while sending OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.length !== 6) {
      setErrorMsg('Code must be exactly 6 digits.');
      return;
    }

    setOtpLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, code: otpInput, userId: activeUserId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      // Successful verification: Set session token and cookies
      document.cookie = `jawaab_admin_session=authenticated_token_active; path=/; max-age=604800; samesite=strict;`;
      
      localStorage.setItem('trial_active', 'true');
      localStorage.setItem('trial_expiry', data.trialExpiresAt);

      setVerificationStep(3);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setOtpLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput, email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.simulated && data.debugCode) {
        alert(`[DEV MODE] Twilio mock OTP: ${data.debugCode}`);
      }

      setResendTimer(30);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex lg:w-[52%] bg-[#f5f5f5] relative overflow-hidden items-center justify-center">
        <div className="absolute top-8 left-8 w-24 h-24 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 opacity-30"></div>
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-lg">
          <div className="relative w-80 h-80 rounded-full bg-white/60 flex items-center justify-center mb-10">
            <div className="relative">
              <div className="absolute -top-12 -left-16 bg-[#1a1a1a] rounded-2xl px-4 py-2 text-white text-[10px] tracking-wider">
                ● ● ● ● ● ● ●
              </div>
              <img 
                src="/icon.png" 
                alt="Jawaab AI" 
                className="w-40 h-40 object-contain drop-shadow-lg"
              />
            </div>
          </div>
          <h2 className="text-3xl font-syne font-bold text-[#1a1a1a] leading-snug">Fully automated chats</h2>
          <p className="text-2xl font-syne font-medium text-accent italic mt-1">in one click.</p>
        </div>
      </div>

      {/* Right Panel: Auth & Verification */}
      <div className="flex-1 bg-background flex flex-col justify-center items-center px-6 py-12 lg:px-16 relative overflow-hidden min-h-screen lg:min-h-0">
        <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-sm space-y-7">
          
          {!showPhoneVerification ? (
            // STANDARD SIGN-IN / SIGN-UP VIEW
            <>
              <div className="flex flex-col items-start space-y-4">
                <BrandLogo size="lg" />
                <div>
                  <h1 className="text-2xl font-syne font-bold text-white">
                    {activeTab === 'signin' ? (
                      <><span className="text-accent">Login</span> to your Account</>
                    ) : (
                      <><span className="text-accent">Create</span> an Account</>
                    )}
                  </h1>
                  <p className="text-secondary text-sm mt-1">See what is going on with your business</p>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="secondary"
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="w-full justify-center gap-2.5 h-11 text-sm text-white border border-border bg-surface hover:bg-white/5 font-semibold rounded-lg"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <span className="relative px-3 text-[10px] uppercase text-secondary bg-background font-semibold tracking-widest">
                  or Sign in with Email
                </span>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg flex items-start gap-2">
                  <span className="font-semibold">Error:</span> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="bg-accent/10 border border-accent/20 text-accent text-xs py-2.5 px-3 rounded-lg">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mail@abc.com"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-secondary block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-accent text-white"
                    required
                  />
                </div>

                {activeTab === 'signin' && (
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border bg-surface accent-accent cursor-pointer"
                      />
                      <span className="text-xs text-accent font-medium">Remember Me</span>
                    </label>
                    <a href="#" className="text-xs text-accent hover:underline font-medium font-syne">Forgot Password?</a>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full justify-center gap-2 h-11 font-bold text-sm bg-accent text-background hover:bg-accent/80 rounded-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Please Wait
                    </>
                  ) : activeTab === 'signin' ? (
                    'Login'
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-secondary">
                {activeTab === 'signin' ? (
                  <>
                    Not Registered Yet?{' '}
                    <button 
                      onClick={() => { setActiveTab('signup'); setErrorMsg(null); setSuccessMsg(null); }}
                      className="text-accent font-semibold hover:underline font-syne"
                    >
                      Create an account
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button 
                      onClick={() => { setActiveTab('signin'); setErrorMsg(null); setSuccessMsg(null); }}
                      className="text-accent font-semibold hover:underline font-syne"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </>
          ) : (
            // ENFORCED OTP PHONE VERIFICATION INTERCEPT
            <div className="space-y-6">
              <div className="flex flex-col items-start space-y-2">
                <BrandLogo size="md" />
                <h2 className="text-lg font-bold text-white font-syne">Verification Required</h2>
                <p className="text-xs text-secondary">Complete phone trial activation to gain dashboard access.</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg">
                  {errorMsg}
                </div>
              )}

              {/* STEP 1: Phone Input */}
              {verificationStep === 1 && (
                <form onSubmit={handleRequestOtp} className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">WhatsApp Phone Number</label>
                    <div className="relative">
                      <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                      <input 
                        type="tel"
                        required
                        placeholder="+919876543210"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-secondary">A 6-digit trial registration code will be sent to your phone via SMS/WhatsApp.</p>
                  <Button type="submit" className="w-full justify-center h-11 gap-2 font-bold" disabled={otpLoading}>
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send OTP Verification'}
                  </Button>
                </form>
              )}

              {/* STEP 2: Enter OTP */}
              {verificationStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Enter 6-Digit Code</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                      <input 
                        type="text"
                        maxLength={6}
                        required
                        placeholder="000000"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-surface border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-accent text-white tracking-[0.4em] font-mono text-center font-bold text-lg"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-secondary">Verification sent to {phoneInput}</span>
                    <button 
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendTimer > 0 || otpLoading}
                      className={`font-bold ${resendTimer > 0 ? 'text-secondary cursor-not-allowed' : 'text-accent hover:underline'}`}
                    >
                      {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend Code'}
                    </button>
                  </div>

                  <Button type="submit" className="w-full justify-center h-11 font-bold text-sm" disabled={otpLoading}>
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify Code'}
                  </Button>
                </form>
              )}

              {/* STEP 3: Success Redirect */}
              {verificationStep === 3 && (
                <div className="space-y-6 text-center py-4 animate-in scale-in duration-300">
                  <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-md font-syne">Phone Verified Successfully</h3>
                    <p className="text-xs text-secondary mt-1">Your secure session active credentials are now enabled.</p>
                  </div>
                  <Button 
                    onClick={async () => {
                      const { data: pref } = await supabase
                        .from('onboarding_preferences')
                        .select('id')
                        .eq('user_id', activeUserId)
                        .maybeSingle();

                      if (pref) {
                        router.push('/dashboard');
                      } else {
                        router.push('/onboarding');
                      }
                    }}
                    className="w-full justify-center h-11 gap-2 font-bold"
                  >
                    Enter Workspace <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Cancel back to standard layout option */}
              {verificationStep !== 3 && (
                <button 
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setActiveUserId(null);
                    setShowPhoneVerification(false);
                    setErrorMsg(null);
                  }}
                  className="w-full text-center text-xs text-secondary hover:underline py-1.5"
                >
                  Cancel & Sign Out
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
