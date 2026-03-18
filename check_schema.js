const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from('sanitation_plans')
    .select('*')
    .limit(1);
    
  console.log("Data:", data);
  console.log("Error:", error);
}

checkSchema();
