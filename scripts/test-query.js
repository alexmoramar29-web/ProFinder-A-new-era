const fs = require('fs');
const envStr = fs.readFileSync('.env', 'utf8');
const env = {};
envStr.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
async function test() {
  const {data, error} = await s.from('appointments').select('*, clientes:users!client_id(full_name), services:service_id(service_name, base_price)').limit(1);
  console.log('appointments users!client_id:', error?.message || data);
  const {data:d2, error:e2} = await s.from('appointments').select('*, users(full_name)').limit(1);
  console.log('appointments users():', e2?.message || d2);
}
test();
