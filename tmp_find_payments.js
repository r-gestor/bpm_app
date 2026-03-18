
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findPayments() {
  const buyerId = 'f4fb43ec-19c0-4485-93ec-c00dada67230';
  console.log(`--- Checking payments for user ${buyerId} ---`);
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*, products(*)')
    .eq('buyerId', buyerId)
    .order('createdAt', { ascending: false });

  if (error) console.error(error);
  else console.log(JSON.stringify(payments, null, 2));
}

findPayments();
