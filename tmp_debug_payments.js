
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
  console.log('--- Checking payments structure ---');
  const { data: payments, error: pError } = await supabase
    .from('payments')
    .select('*')
    .limit(1);

  if (pError) {
    console.error('Error fetching payment:', pError);
  } else if (payments && payments.length > 0) {
    console.log('Payment columns:', Object.keys(payments[0]));
  } else {
    console.log('No payments found');
  }

  // Check if there's any payment related to the problematic plan
  // Since there's no metadata column in sanitation_plans, maybe payments have a planId?
}

debug();
