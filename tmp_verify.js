const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await supabase.from('answers').select('id, questionId, text').ilike('text', '%Opción correcta%');
  console.log(JSON.stringify(data, null, 2));

  // let's also delete them because they might be orphaned answers (no matching question??)
  if (data && data.length > 0) {
    const qIds = [...new Set(data.map(d => d.questionId))];
    const { data: questions } = await supabase.from('questions').select('id').in('id', qIds);
    console.log("Questions that own these answers:", questions.length);
  }
}
check();
