'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase-client';
import { Button } from '../../components/ui/Button';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { ArrowRight, Loader2, Award, Sparkles, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Preference selections
  const [businessType, setBusinessType] = useState('');
  const [missedCalls, setMissedCalls] = useState('');
  const [receptionMethod, setReceptionMethod] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Not logged in, send to login
        router.push('/login');
      } else {
        // Double check phone verification status
        try {
          const res = await fetch(`/api/auth/phone-check?userId=${session.user.id}`);
          if (res.ok) {
            const phoneData = await res.json();
            if (!phoneData.verified) {
              console.warn('[Onboarding] Enforced phone verification check failed. Signing out.');
              await supabase.auth.signOut();
              router.push('/login');
              return;
            }
          } else {
            await supabase.auth.signOut();
            router.push('/login');
            return;
          }
        } catch (e) {
          console.error(e);
        }

        setSessionUser(session.user);
        
        // Double check if onboarding was already completed
        const { data: existing } = await supabase
          .from('onboarding_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (existing) {
          router.push('/dashboard');
        }
      }
    };
    checkSession();
  }, [router]);

  const handleSubmitOnboarding = async () => {
    if (!businessType || !missedCalls || !receptionMethod || !primaryGoal || !sessionUser) {
      setErrorMsg('Please answer all preferences questions.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase
        .from('onboarding_preferences')
        .insert({
          user_id: sessionUser.id,
          business_type: businessType,
          missed_calls_per_day: missedCalls,
          current_receptionist_method: receptionMethod,
          primary_goal: primaryGoal,
        });

      if (error) throw error;

      // Make sure authentication cookie is active
      document.cookie = `jawaab_admin_session=authenticated_token_active; path=/; max-age=604800; samesite=strict;`;
      
      // Auto-create business default template record so profile saves don't error out
      try {
        await fetch('/api/business', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Cookie': document.cookie },
          body: JSON.stringify({
            name: `${businessType} Shop`,
            owner_name: 'Owner',
            phone_number: '+919999999999',
            whatsapp_number: '+919999999999',
            operating_hours: {
              monday: { open: '09:00', close: '18:00', closed: false },
              tuesday: { open: '09:00', close: '18:00', closed: false },
              wednesday: { open: '09:00', close: '18:00', closed: false },
              thursday: { open: '09:00', close: '18:00', closed: false },
              friday: { open: '09:00', close: '18:00', closed: false },
              saturday: { open: '10:00', close: '16:00', closed: false },
              sunday: { open: '00:00', close: '00:00', closed: true },
            },
            fallback_number: '+919999999999',
            voice_gender: 'female',
            greeting_message: `Namaste. Welcome to our ${businessType} clinic. How can we help you?`,
            telephony_provider: 'exotel',
            answering_mode: 'always_answer'
          })
        });
      } catch (bizErr) {
        console.error('Failed to create fallback business template:', bizErr);
      }

      router.push('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save onboarding selections.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !businessType) return;
    if (step === 2 && !missedCalls) return;
    if (step === 3 && !receptionMethod) return;
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-[15%] left-[10%] w-[35%] h-[35%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(214,255,0,0.02)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[15%] right-[10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[rgba(255,255,255,0.01)] to-transparent z-[-1] blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        
        {/* Onboarding Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo size="md" className="mb-2" />
          <h1 className="text-2xl font-bold tracking-tight text-white font-syne">Configure Your Receptionist</h1>
          <p className="text-secondary text-xs">Let's align Jawaab AI to match your business requirements.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-secondary uppercase tracking-wider">
          <span>Preferences Profile</span>
          <span>Step {step} of 4</span>
        </div>
        <div className="w-full h-1 bg-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-500" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Form Container */}
        <div className="bg-surface border border-border rounded-2xl p-6 md:p-8 shadow-2xl relative">
          
          {errorMsg && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Business Type */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">1. What kind of business do you run?</h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Dental / Medical Clinic',
                  'Hair Salon / Spa',
                  'Consulting / Legal Firm',
                  'Real Estate Agent',
                  'Home Repairs / Local Services',
                  'E-commerce / Retail',
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setBusinessType(type)}
                    className={`text-left p-4 rounded-xl border text-xs font-semibold transition-all ${
                      businessType === type
                        ? 'border-accent bg-accent/5 text-accent shadow-sm shadow-accent/5'
                        : 'border-border bg-background hover:bg-white/5 text-secondary hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex justify-end pt-3">
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  disabled={!businessType}
                  className="gap-2 font-bold"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Missed Calls */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">2. How many calls do you miss per day?</h2>
              <div className="space-y-2.5">
                {[
                  { value: '1-5', label: '1 to 5 calls per day (Small leaks)' },
                  { value: '5-10', label: '5 to 10 calls per day (Losing potential bookings)' },
                  { value: '10-20', label: '10 to 20 calls per day (Significant revenue loss)' },
                  { value: '20+', label: '20+ calls per day (Urgent need for reception automation)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMissedCalls(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      missedCalls === opt.value
                        ? 'border-accent bg-accent/5 text-accent shadow-sm'
                        : 'border-border bg-background hover:bg-white/5 text-secondary hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-secondary font-mono">{opt.value}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-3">
                <Button type="button" variant="ghost" onClick={prevStep}>Back</Button>
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  disabled={!missedCalls}
                  className="gap-2 font-bold"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Current Method */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">3. How are you currently answering calls?</h2>
              <div className="space-y-2.5">
                {[
                  { value: 'self', label: 'I answer them myself (Interrupts consulting/work)' },
                  { value: 'hired', label: 'I hire a receptionist (High salary overhead)' },
                  { value: 'forwarding', label: 'I use a legacy call center (Lacks business context)' },
                  { value: 'none', label: 'Nobody answers missed calls (Leads go directly to competitors)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReceptionMethod(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      receptionMethod === opt.value
                        ? 'border-accent bg-accent/5 text-accent shadow-sm'
                        : 'border-border bg-background hover:bg-white/5 text-secondary hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-3">
                <Button type="button" variant="ghost" onClick={prevStep}>Back</Button>
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  disabled={!receptionMethod}
                  className="gap-2 font-bold"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Goals */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">4. What is your primary goal with Jawaab AI?</h2>
              <div className="space-y-2.5">
                {[
                  { value: 'leads', label: 'Capture and secure incoming bookings & customer leads' },
                  { value: 'costs', label: 'Reduce receptionist salary overhead costs' },
                  { value: 'hours', label: 'Provide 24/7 coverage for after-hour timings & FAQs' },
                  { value: 'whatsapp', label: 'Get instant WhatsApp summary alerts for customer logs' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrimaryGoal(opt.value)}
                    className={`w-full text-left p-4 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      primaryGoal === opt.value
                        ? 'border-accent bg-accent/5 text-accent shadow-sm'
                        : 'border-border bg-background hover:bg-white/5 text-secondary hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex justify-between pt-3">
                <Button type="button" variant="ghost" onClick={prevStep}>Back</Button>
                <Button 
                  type="button" 
                  onClick={handleSubmitOnboarding} 
                  disabled={!primaryGoal || loading}
                  className="gap-2 font-bold bg-accent text-background hover:bg-accent/80 border border-accent/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Preparing Console
                    </>
                  ) : (
                    <>
                      Configure Dashboard <Sparkles className="w-4 h-4 text-background" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
