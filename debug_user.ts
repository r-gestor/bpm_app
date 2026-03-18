import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://dlnbvcfsnyxhjwurqakm.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbmJ2Y2Zzbnl4aGp3dXJxYWttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3ODcyOCwiZXhwIjoyMDg4NjU0NzI4fQ.Jgn86X9lxJlzBFfPArBvcr1SAgBvk1O-K6qQ6KkUxuQ";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function debugUser(studentId: string) {
  console.log('--- DEBUGGING USER:', studentId, '---');
  
  const { data: enrollments, error: eError } = await supabase
    .from('enrollments')
    .select('*')
    .eq('studentId', studentId);
  console.log('Enrollments:', enrollments || eError);

  const { data: attempts, error: aError } = await supabase
    .from('exam_attempts')
    .select('*')
    .eq('studentId', studentId)
    .order('createdAt', { ascending: false });
  console.log('Exam Attempts (last 5):', JSON.stringify(attempts?.slice(0, 5) || aError, null, 2));

  const { data: certificates, error: cError } = await supabase
    .from('certificates')
    .select('*')
    .eq('studentId', studentId);
  console.log('Certificates:', certificates || cError);

  const { data: courses } = await supabase.from('courses').select('id, title');
  console.log('Courses:', courses);
}

const userId = process.argv[2] || 'b2b56446-055d-4b78-bc62-3fa9a604c73c';
debugUser(userId);
