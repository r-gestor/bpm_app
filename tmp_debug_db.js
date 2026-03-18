
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debug() {
  console.log('--- Checking sanitation_plans structure ---');
  const { data: columns, error: cError } = await supabase
    .from('sanitation_plans')
    .select('*')
    .limit(1);

  if (cError) {
    console.error('Error fetching plan:', cError);
  } else if (columns && columns.length > 0) {
    console.log('Plan columns:', Object.keys(columns[0]));
    console.log('Plan data:', JSON.stringify(columns[0], null, 2));
  } else {
    console.log('No plans found in sanitation_plans');
  }

  console.log('\n--- Checking status for plan 4808503e... ---');
  const { data: specificPlan, error: sError } = await supabase
    .from('sanitation_plans')
    .select('*')
    .eq('id', '4808503e-2b1a-4ef6-84f8-2586b89a497d')
    .maybeSingle();

  if (sError) console.error('Error fetching specific plan:', sError);
  else console.log('Specific Plan Status:', specificPlan?.status);
}

debug();
