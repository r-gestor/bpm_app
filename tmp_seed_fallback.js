const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixMissingAnswers() {
  const { data: dbQuestions, error: qError } = await supabase.from('questions').select('*');
  
  if (qError) {
    console.error("Error fetching questions:", qError);
    return;
  }

  // Get questions that don't have enough answers
  const { data: allAnswers, error: aError } = await supabase.from('answers').select('questionId');
  if (aError) {
    console.error("Error fetching answers:", aError);
    return;
  }

  // Group by questionId
  const answerCounts = {};
  for (const a of allAnswers) {
    answerCounts[a.questionId] = (answerCounts[a.questionId] || 0) + 1;
  }

  let insertedCount = 0;

  for (const dbQ of dbQuestions) {
    const count = answerCounts[dbQ.id] || 0;
    if (count < 4) {
      console.log(`Seeding fallback answers for: ${dbQ.text.substring(0, 30)}...`);
      // First delete any incomplete answers
      await supabase.from('answers').delete().eq('questionId', dbQ.id);

      const genericOptions = [
        "Opción correcta (válida por defecto)",
        "Segunda opción incorrecta",
        "Tercera opción de respuesta",
        "Cuarta opción no válida"
      ];

      const inserts = genericOptions.map((opt, idx) => ({
        questionId: dbQ.id,
        text: opt,
        isCorrect: idx === 0
      }));

      const { error: iError } = await supabase.from('answers').insert(inserts);
      if (iError) {
        console.error("Error inserting answers:", iError);
      } else {
        insertedCount += inserts.length;
      }
    }
  }

  console.log(`\n✅ Done! Inserted ${insertedCount} fallback answers.`);
}

fixMissingAnswers();
