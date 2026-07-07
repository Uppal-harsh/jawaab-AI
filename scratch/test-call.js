const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');

// Native .env parser (avoids 'dotenv' dependency issues)
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf-8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = val;
    }
  });
}

async function run() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Missing Supabase configuration in .env");
    return;
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  console.log("1. Checking for existing businesses in Supabase...");
  let { data: business } = await supabase.from('businesses').select('*').limit(1).maybeSingle();

  if (!business) {
    console.log("No business found. Creating a test business entry...");
    const { data: newBusiness, error } = await supabase.from('businesses').insert({
      name: "Jawaab Healthcare Clinic",
      owner_name: "Dr. Uppal",
      phone_number: "+919876543210",
      whatsapp_number: "+919876543210"
    }).select('*').single();

    if (error) {
      console.error("Failed to create business:", error);
      return;
    }
    business = newBusiness;
  }

  console.log(`Using Business ID: ${business.id} ("${business.name}")`);

  // Ensure settings exist
  let { data: settings } = await supabase.from('business_settings').select('*').eq('business_id', business.id).maybeSingle();
  if (!settings) {
    const { error: settingsErr } = await supabase.from('business_settings').insert({
      business_id: business.id,
      greeting_message: "Hello, welcome to Jawaab Healthcare. How can we help you?",
      voice_gender: "female",
      answering_mode: "always_answer"
    });
    if (settingsErr) console.error("Settings insert failed:", settingsErr);
  }

  // Create a sample knowledge card
  let { data: card } = await supabase.from('knowledge_cards').select('*').eq('business_id', business.id).maybeSingle();
  if (!card) {
    console.log("Creating sample Knowledge Card for consultation fee...");
    const { error: cardErr } = await supabase.from('knowledge_cards').insert({
      business_id: business.id,
      category: "pricing",
      question_trigger: "consultation fee",
      answer_content: "The consultation fee is 500 rupees, payable by cash or UPI.",
      is_active: true
    });
    if (cardErr) console.error("Card insert failed:", cardErr);
  }

  // Create a call log session matching this call_sid
  const callSid = `exotel-call-${Math.floor(Math.random() * 100000)}`;
  const { error: callInsertErr } = await supabase.from('calls').insert({
    business_id: business.id,
    telephony_call_id: callSid,
    caller_number: '+919999988888',
    start_time: new Date().toISOString()
  });
  if (callInsertErr) console.error("Call insert failed:", callInsertErr);

  const callerText = "Hi, what is your consultation fee?";

  console.log(`\n2. Dispatching mock Exotel call turn...`);
  console.log(`Caller input: "${callerText}"`);

  // Target Exotel process webhook route
  const url = `http://localhost:3001/api/telephony/incoming/process`;
  
  const payload = {
    call_sid: callSid,
    SpeechResult: callerText
  };

  const rawBody = JSON.stringify(payload);
  const webhookSecret = process.env.EXOTEL_WEBHOOK_SECRET || 'test_secret';

  // Compute secure Exotel webhook signature
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-exotel-signature': signature
      },
      body: rawBody
    });

    const bodyText = await res.text();
    console.log(`\n3. Exotel XML Response:\n`);
    console.log(bodyText);
  } catch (err) {
    console.error("Failed to connect to local dev server. Is 'npm run dev' running on port 3000?", err.message);
  }
}

run();
