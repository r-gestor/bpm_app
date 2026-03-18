
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugJoin() {
  console.log('--- Checking payments + products join ---');
  const { data: order, error } = await supabase
    .from('payments')
    .select('*, products(*)')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error:', error);
  } else if (order) {
    console.log('Payment data keys:', Object.keys(order));
    console.log('Products type:', typeof order.products);
    console.log('Is products array?', Array.isArray(order.products));
    if (order.products) {
      console.log('Product details:', JSON.stringify(order.products, null, 2));
    }
  } else {
    console.log('No payments found');
  }
}

debugJoin();
