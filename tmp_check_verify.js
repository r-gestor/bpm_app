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

  console.log("Testing with examAttempt and Student:");
  const test2 = await supabase
      .from('certificates')
      .select(`
        *,
        student:users!studentId(name),
        examAttempt:ExamAttempt!examAttemptId(
          course:Course!courseId(title)
        )
      `)
      .eq('certificateCode', code)
      .single();
  console.log("Test2 error:", test2.error?.message);
  
  if(test2.error) {
    console.log("Trying different casing for examAttempt/course...");
    const test3 = await supabase
      .from('certificates')
      .select(`
        *,
        student:users!studentId(name),
        ExamAttempt!examAttemptId(
          Course!courseId(title)
        )
      `)
      .eq('certificateCode', code)
      .single();
    console.log("Test3 error:", test3.error?.message);
    console.log("Test3 Data:", JSON.stringify(test3.data, null, 2));
  } else {
    console.log("Test2 Data:", JSON.stringify(test2.data, null, 2));
  }
}
check();
