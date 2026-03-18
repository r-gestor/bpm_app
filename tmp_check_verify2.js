const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const code = "BPM-CERT-2C3CF300";
  console.log("Testing with enrollments:");
  const test1 = await supabase
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
      
  console.log("Test1 error:", test1.error?.message);
  console.log("Test1 Data:", JSON.stringify(test1.data, null, 2));

  // What about examAttempts?
  const test4 = await supabase
      .from('certificates')
      .select(`
        *,
        student:users!studentId(name),
        examAttempt:exam_attempts!examAttemptId(
          course:courses!courseId(title)
        )
      `)
      .eq('certificateCode', code)
      .single();
      
  console.log("Test4 (exam_attempts) error:", test4.error?.message);
  console.log("Test4 (exam_attempts) Data:", JSON.stringify(test4.data, null, 2));

}
check();
