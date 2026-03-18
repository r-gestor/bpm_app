import { createClient } from '@supabase/supabase-js';
import process from 'process';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const codes = [
  { code: 'JAMUNDI12', percentage: 12, active: true },
  { code: 'JAMUNDI33', percentage: 33, active: true },
  { code: 'JAMUNDI46', percentage: 46, active: true },
  { code: 'JAMUNDI57', percentage: 57, active: true },
  { code: 'JAMUNDI78', percentage: 78, active: true },
  { code: 'JAMUNDI99', percentage: 99, active: true }
];

async function seed() {
  console.log('Inserting discount codes...');
  const { data, error } = await supabase
    .from('discount_codes')
    .upsert(codes, { onConflict: 'code' });

  if (error) {
    console.error('Error inserting discount codes:', error);
  } else {
    console.log('Successfully inserted discount codes: JAMUNDI12, JAMUNDI33, JAMUNDI46, JAMUNDI57, JAMUNDI78, JAMUNDI99');
  }
}

seed();
