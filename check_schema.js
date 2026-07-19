const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://eqlitwaokkrafjtmuhbu.supabase.co', 'sb_publishable_aY5wKAtMwKBSvnHr2roExg_sLxuXf_H');
async function run() {
  const { data: profs } = await supabase.from('professionals').select('prof_id').limit(1);
  const prof_id = profs[0].prof_id;
  const { error } = await supabase.from('service_schedules').insert([{
    prof_id: prof_id,
    service_id: null,
    day_of_week: 'VACATION_2026-07-20',
    start_time: '00:00:00',
    end_time: '23:59:59'
  }]);
  console.log('Insert with null service_id:', error ? error.message : 'SUCCESS');
  if(!error) {
    await supabase.from('service_schedules').delete().eq('day_of_week', 'VACATION_2026-07-20');
  }
}
run();
