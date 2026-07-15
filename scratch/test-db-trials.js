const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envConfig = fs.readFileSync(envPath, 'utf-8');
const env = {};
envConfig.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const tables = [
  'businesses',
  'business_settings',
  'knowledge_cards',
  'calls',
  'call_summaries',
  'prompt_configurations',
  'phone_trials',
  'onboarding_preferences'
];

async function checkAll() {
  console.log('Checking all tables...');
  for (const t of tables) {
    const { error } = await supabase.from(t).select('*').limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`❌ Table '${t}' does NOT exist.`);
    } else if (error) {
      console.log(`⚠️ Table '${t}' returned error: ${error.message}`);
    } else {
      console.log(`✅ Table '${t}' exists.`);
    }
  }
}

checkAll();
