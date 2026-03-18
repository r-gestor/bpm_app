const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  const { data, error } = await supabase.rpc('get_tables'); // Or query information_schema if no RPC
  if (error) {
    // try direct SQL if we had pg, but we have supabase js so we can query pg_tables if exposed, but it isn't via rest usually.
    // let's try reading a row from Question vs questions
    console.log("Testing Question table...");
    const q1 = await supabase.from('Question').select('*').limit(1);
    console.log("Question table result:", !!q1.data);
    if (q1.data) console.log("Sample:", q1.data);

    console.log("Testing questions table...");
    const q2 = await supabase.from('questions').select('*').limit(1);
    console.log("questions table result:", !!q2.data);
    if (q2.data) console.log("Sample:", q2.data);
  } else {
    console.log(data);
  }
}
checkTables();
