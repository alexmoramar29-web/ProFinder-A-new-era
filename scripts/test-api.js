const https = require('https');
const options = {
  hostname: 'eqlitwaokkrafjtmuhbu.supabase.co',
  path: '/rest/v1/appointments?select=*,clientes:users!client_id(full_name),services(service_name)&limit=1',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_aY5wKAtMwKBSvnHr2roExg_sLxuXf_H',
    'Authorization': 'Bearer sb_publishable_aY5wKAtMwKBSvnHr2roExg_sLxuXf_H',
    'Accept': 'application/json'
  }
};
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => { data += d; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});
req.on('error', (e) => {
  console.error(e);
});
req.end();
