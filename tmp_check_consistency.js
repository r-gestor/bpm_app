
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkInconsistency() {
  console.log('--- Checking for status inconsistencies ---');
  
  // Find users with APPROVED payments for sanitation plans
  const { data: payments, error: pError } = await supabase
    .from('payments')
    .select('*, products(*)')
    .eq('status', 'APPROVED');

  if (pError) {
    console.error('Payment fetch error:', pError);
    return;
  }

  const sanitationPayments = payments.filter(p => p.products?.slug === 'plan-saneamiento-iav');
  console.log(`Found ${sanitationPayments.length} APPROVED sanitation payments.`);

  for (const pay of sanitationPayments) {
    console.log(`Checking plans for buyer ${pay.buyerId}...`);
    const { data: plans, error: sError } = await supabase
      .from('sanitation_plans')
      .select('id, status')
      .eq('ownerId', pay.buyerId);

    if (sError) {
      console.error('Plan fetch error:', sError);
      continue;
    }

    console.log(`User ${pay.buyerId} has plans:`, JSON.stringify(plans));
  }
}

checkInconsistency();
