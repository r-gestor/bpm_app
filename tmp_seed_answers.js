const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const questionsWithAnswers = [
  {
    text: "¿Cuál es la temperatura mínima recomendada para la cocción de aves?",
    options: ["60°C", "74°C", "85°C", "100°C"],
    correctAnswer: 1
  },
  {
    text: "¿Qué es la contaminación cruzada?",
    options: [
      "El paso de microorganismos de un alimento contaminado a otro que no lo está.",
      "Cocinar dos alimentos diferentes al mismo tiempo.",
      "Lavar los alimentos antes de consumirlos.",
      "Almacenar alimentos en el refrigerador."
    ],
    correctAnswer: 0
  },
  {
    text: "¿Con qué frecuencia deben lavarse las manos un manipulador de alimentos?",
    options: [
      "Cada 2 horas.",
      "Solo al inicio de la jornada.",
      "Después de cualquier interrupción o manipulación de residuos.",
      "Solo después de ir al baño."
    ],
    correctAnswer: 2
  },
  {
    text: "¿Cuál es la zona de peligro de temperatura para los alimentos?",
    options: ["0°C a 10°C", "5°C a 60°C", "10°C a 40°C", "20°C a 80°C"],
    correctAnswer: 1
  },
  {
    text: "¿Qué práctica es fundamental para evitar la proliferación de bacterias en alimentos perecederos?",
    options: [
      "Dejarlos a temperatura ambiente para que se atemperen.",
      "Mantenerlos en refrigeración a 4°C o menos.",
      "Guardarlos en envases cerrados fuera de la nevera.",
      "Calentarlos una vez al día."
    ],
    correctAnswer: 1
  },
  {
    text: "¿Cuál es el método más seguro para descongelar alimentos?",
    options: [
      "Dejarlos sobre la mesa de la cocina durante la noche.",
      "Sumergirlos en agua caliente.",
      "En el refrigerador, planificando con anticipación.",
      "Exponerlos al sol para que se descongelen rápido."
    ],
    correctAnswer: 2
  },
  {
    text: "¿Qué elemento de protección es obligatorio usar constantemente en el área de manipulación?",
    options: [
      "Gafas de sol.",
      "Reloj y pulseras para medir el tiempo.",
      "Cofia o malla para el cabello.",
      "Perfume para enmascarar olores."
    ],
    correctAnswer: 2
  },
  {
    text: "¿Cuál de las siguientes prácticas está PROHIBIDA para un manipulador de alimentos?",
    options: [
      "Fumar, comer o masticar chicle en las zonas de manipulación.",
      "Lavarse las manos con agua y jabón.",
      "Usar uniforme de color claro y limpio.",
      "Mantener las uñas cortas y sin esmalte."
    ],
    correctAnswer: 0
  },
  {
    text: "¿Qué normativa colombiana regula las Buenas Prácticas de Manufactura para alimentos?",
    options: [
      "Decreto 616 de 2006.",
      "Resolución 2674 de 2013.",
      "Ley 9 de 1979.",
      "Decreto 1500 de 2007."
    ],
    correctAnswer: 1
  },
  {
    text: "¿Qué es una Enfermedad de Transmisión Alimentaria (ETA)?",
    options: [
      "Una alergia causada por el consumo de mariscos.",
      "Enfermedad causada o transmitida por el consumo de alimentos o agua contaminados.",
      "Un malestar estomacal leve y temporal.",
      "Una enfermedad respiratoria que se adquiere en la cocina."
    ],
    correctAnswer: 1
  }
];

// Fallback logic if we can't find exact matches
function findBestMatch(dbQuestion, questionsList) {
  // Try exact match or very close match
  for (const q of questionsList) {
    if (q.text.toLowerCase().trim() === dbQuestion.text.toLowerCase().trim() || 
        dbQuestion.text.includes(q.text.substring(0, 20))) {
      return q;
    }
  }
  return null;
}

async function fixAnswers() {
  console.log("Fetching existing questions...");
  const { data: dbQuestions, error: qError } = await supabase.from('questions').select('*');
  
  if (qError) {
    console.error("Error fetching questions:", qError);
    return;
  }

  console.log(`Found ${dbQuestions.length} questions in the database.`);

  console.log("Deleting existing answers...");
  const { error: dError } = await supabase.from('answers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  if (dError) {
    console.error("Error deleting old answers:", dError);
    return;
  }

  let insertedCount = 0;

  for (const dbQ of dbQuestions) {
    const template = findBestMatch(dbQ, questionsWithAnswers);
    if (template) {
      console.log(`Seeding answers for: ${template.text.substring(0, 30)}...`);
      const inserts = template.options.map((opt, idx) => ({
        questionId: dbQ.id,
        text: opt,
        isCorrect: idx === template.correctAnswer
      }));

      const { error: iError } = await supabase.from('answers').insert(inserts);
      if (iError) {
        console.error("Error inserting answers for question:", iError);
      } else {
        insertedCount += inserts.length;
      }
    } else {
      console.warn(`⚠️ No template found for DB question: ${dbQ.text}`);
    }
  }

  console.log(`\n✅ Done! Inserted ${insertedCount} answers.`);
}

fixAnswers();
