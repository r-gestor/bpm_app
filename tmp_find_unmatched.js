const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findUnmatched() {
  const { data: genericAnswers, error: aError } = await supabase
    .from('answers')
    .select('questionId')
    .ilike('text', '%opción%');
  
  if (genericAnswers) {
    const ids = [...new Set(genericAnswers.map(a => a.questionId))];
    if (ids.length > 0) {
      const { data: questions } = await supabase
        .from('questions')
        .select('text')
        .in('id', ids);
      
      console.log(JSON.stringify(questions, null, 2));
    }
  }
}

findUnmatched();
