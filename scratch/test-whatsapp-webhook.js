const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env manually
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
} catch (e) {
  console.warn('Could not load .env file:', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('--- Starting WhatsApp Webhook End-to-End Simulation ---');

  // 1. Setup a dummy business to bypass resolution and check
  console.log('\n1. Checking/creating mock business profile...');
  let { data: business } = await supabase
    .from('businesses')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (!business) {
    const { data: newBiz, error: err } = await supabase
      .from('businesses')
      .insert({
        name: 'Perfect Cut Salon',
        owner_name: 'Harsh Uppal',
        whatsapp_number: '+919999999999',
        timezone: 'Asia/Kolkata'
      })
      .select('*')
      .single();

    if (err) {
      console.error('Failed to create mock business profile:', err);
      process.exit(1);
    }
    business = newBiz;
    console.log(`Created mock business: ${business.name}`);
  } else {
    console.log(`Using existing business: ${business.name} (${business.whatsapp_number})`);
  }

  // 2. Ensure business settings are configured
  let { data: settings } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', business.id)
    .maybeSingle();

  if (!settings) {
    const { error: sErr } = await supabase
      .from('business_settings')
      .insert({
        business_id: business.id,
        greeting_message: 'Hello! Welcome to Perfect Cut Salon. How can we help you?',
        calendar_integration_enabled: true
      });
    if (sErr) {
      console.error('Failed to create mock business settings:', sErr);
      process.exit(1);
    }
    console.log('Created mock business settings.');
  }

  // 3. Send a simulated POST request to local webhook
  console.log('\n2. Sending simulated customer message payload to webhook...');
  const webhookUrl = 'http://localhost:3000/api/whatsapp/webhook';
  
  const mockPayload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '1234567890',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+919999999999',
                phone_number_id: '9876543210'
              },
              contacts: [
                {
                  profile: {
                    name: 'Test Customer'
                  },
                  wa_id: '918888888888'
                }
              ],
              messages: [
                {
                  from: '918888888888',
                  id: 'wamid.HBgLOTE4ODg4ODg4ODg4FQIAERgSQjE4MkFDOTg3NkE1NDMyMUEA',
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: "Hi, I'd like to book a haircut tomorrow at 3 PM please. My name is Test Customer."
                  },
                  type: 'text'
                }
              ]
            },
            field: 'messages'
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockPayload)
    });

    const result = await response.json();
    console.log('\nWebhook Response Status:', response.status);
    console.log('Webhook Response Body:', JSON.stringify(result, null, 2));

    // 4. Verify database logs
    console.log('\n3. Querying database for newly logged conversation and messages...');
    
    const { data: conversations } = await supabase
      .from('conversations')
      .select('*')
      .eq('business_id', business.id)
      .eq('customer_whatsapp_number', '918888888888')
      .order('created_at', { ascending: false });

    if (conversations && conversations.length > 0) {
      const conv = conversations[0];
      console.log(`✓ Found active conversation (ID: ${conv.id})`);
      
      const { data: dbMsgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      console.log(`✓ Found ${dbMsgs ? dbMsgs.length : 0} messages in conversation:`);
      dbMsgs.forEach(m => {
        console.log(`  [${m.direction.toUpperCase()} - ${m.sender}]: "${m.content}"`);
      });

      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('conversation_id', conv.id);

      if (leads && leads.length > 0) {
        console.log(`✓ Lead created: Name: ${leads[0].customer_name}, Status: ${leads[0].status}`);
        
        const { data: appts } = await supabase
          .from('appointments')
          .select('*')
          .eq('lead_id', leads[0].id);

        if (appts && appts.length > 0) {
          console.log(`✓ Appointment scheduled for: ${new Date(appts[0].scheduled_time).toLocaleString('en-IN')}`);
        }
      }
    } else {
      console.error('✗ No conversations found for the customer.');
    }
  } catch (err) {
    console.error('Error during simulated request execution:', err);
  }
}

runTest();
