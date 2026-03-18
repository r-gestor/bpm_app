
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://dlnbvcfsnyxhjwurqakm.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbmJ2Y2Zzbnl4aGp3dXJxYWttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3ODcyOCwiZXhwIjoyMDg4NjU0NzI4fQ.Jgn86X9lxJlzBFfPArBvcr1SAgBvk1O-K6qQ6KkUxuQ");

async function run() {
  console.log('--- COURSES ---');
  const { data: courses } = await supabase.from('courses').select('id, title, productId');
  console.log(courses);

  if (courses) {
    for (const course of courses) {
      const { data: videos } = await supabase.from('course_videos').select('id, title').eq('courseId', course.id);
      console.log(`Course "${course.title}" (${course.id}) has ${videos?.length || 0} videos.`);
    }
  }

  console.log('--- ENROLLMENTS SHAPE ---');
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(`
      id,
      studentId,
      courseId,
      courses (
        id,
        course_videos (id)
      )
    `)
    .limit(1);
  console.log(JSON.stringify(enrollments, null, 2));
}

run();
