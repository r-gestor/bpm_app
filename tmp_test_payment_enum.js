
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPaymentUpdate() {
  // Find a pending payment for manipulacion-alimentos
  const { data: payment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('status', 'PENDING')
    .limit(1)
    .maybeSingle();

  if (!payment) {
    console.log('No pending payments found to test.');
    return;
  }

  console.log(`Testing update for payment ${payment.id} to status APPROVED...`);
  
  const { data, error } = await supabase
    .from('payments')
    .update({ status: 'APPROVED' })
    .eq('id', payment.id)
    .select();

  if (error) {
    console.error('Update failed:', error.message);
  } else {
    console.log('Update successful! Result:', data);
    // Revert back to PENDING for now
    await supabase.from('payments').update({ status: 'PENDING' }).eq('id', payment.id);
  }
}

testPaymentUpdate();
