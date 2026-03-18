const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const code = "BPM-CERT-2C3CF300";

  // Test 1: table "certificates"
  const t1 = await supabase.from('certificates').select('*').eq('certificateCode', code).maybeSingle();
  console.log("certificates table:", t1.error?.message || "OK", t1.data ? "FOUND" : "NOT FOUND");

  // Test 2: table "Certificate"
  const t2 = await supabase.from('Certificate').select('*').eq('certificateCode', code).maybeSingle();
  console.log("Certificate table:", t2.error?.message || "OK", t2.data ? "FOUND" : "NOT FOUND");

  // Test 3: exact certificate data
  if (t1.data || t2.data) {
    const d = t1.data || t2.data;
    console.log("Data:", JSON.stringify(d, null, 2));
  }

  // Test 4: try the full join query from verifyCertificate
  const t4 = await supabase
    .from('certificates')
    .select(`
      *,
      enrollment:enrollments (
        student:users!studentId(name),
        course:courses(title)
      )
    `)
    .eq('certificateCode', code)
    .single();
  console.log("\nFull join query error:", t4.error?.message || "OK");
  console.log("Full join query data:", JSON.stringify(t4.data, null, 2));
}

test();
