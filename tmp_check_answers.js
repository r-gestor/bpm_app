const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAnswers() {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      id,
      text,
      answers (
        id,
        text,
        isCorrect
      )
    `)
    .limit(3);

  if (error) {
    console.error('Error fetching questions and answers:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkAnswers();
