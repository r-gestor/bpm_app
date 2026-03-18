
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
  const planId = '4808503e-2b1a-4ef6-84f8-2586b89a497d';
  console.log(`Testing update for plan ${planId} to status APPROVED...`);
  
  const { data, error } = await supabase
    .from('sanitation_plans')
    .update({ status: 'APPROVED' })
    .eq('id', planId)
    .select();

  if (error) {
    console.error('Update failed:', error.message);
    if (error.message.includes('invalid input value for enum')) {
      console.log('RESULT: The DB enum is missing APPROVED/DECLINED/ERROR statuses.');
    }
  } else {
    console.log('Update successful! Result:', data);
    // Revert back to PENDING for now
    await supabase.from('sanitation_plans').update({ status: 'PENDING' }).eq('id', planId);
  }
}

testUpdate();
