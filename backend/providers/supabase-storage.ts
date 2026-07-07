import { IStorageProvider } from './index';
import { supabaseAdmin } from '../../lib/supabase';
import { BusinessContext, BusinessSettings, PromptConfig, KnowledgeCard } from '../types';

export class SupabaseStorageProvider implements IStorageProvider {
  async getCallSession(callSid: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('calls')
      .select('*')
      .eq('telephony_call_id', callSid)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async saveCallSession(callSid: string, data: any): Promise<void> {
    const { error } = await supabaseAdmin
      .from('calls')
      .upsert({
        telephony_call_id: callSid,
        ...data,
      }, { onConflict: 'telephony_call_id' });

    if (error) throw error;
  }

  async getBusinessDetails(businessId: string): Promise<BusinessContext> {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (error) throw error;
    return data;
  }

  async getBusinessSettings(businessId: string): Promise<BusinessSettings> {
    const { data, error } = await supabaseAdmin
      .from('business_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getCallSummaryByCallId(callId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('call_summaries')
      .select('*')
      .eq('call_id', callId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async saveCallSummary(callId: string, customerPhone: string, data: any): Promise<void> {
    const { error } = await supabaseAdmin
      .from('call_summaries')
      .upsert({
        call_id: callId,
        customer_phone: customerPhone,
        ...data,
      }, { onConflict: 'call_id' });

    if (error) throw error;
  }

  async getPromptConfig(businessId: string): Promise<PromptConfig> {
    const { data, error } = await supabaseAdmin
      .from('prompt_configurations')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getKnowledgeCards(businessId: string): Promise<KnowledgeCard[]> {
    const { data, error } = await supabaseAdmin
      .from('knowledge_cards')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }
}
