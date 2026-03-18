const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const correctAnswersData = {
  "¿En qué etapa de la cadena alimentaria NO puede estar presente un manipulador de alimentos?": {
    options: ["El manipulador puede estar en cualquier etapa desde la producción hasta la comercialización.", "En el almacenamiento", "En la distribución", "En el procesamiento"],
    correctAnswer: 0
  },
  "¿A qué temperatura se considera que los alimentos están en la 'zona de peligro' para el crecimiento bacteriano?": {
    options: ["Entre 5°C y 60°C", "Entre 0°C y 5°C", "Más de 60°C", "Menos de 0°C"],
    correctAnswer: 0
  },
  "¿Qué condición NO favorece el crecimiento de bacterias patógenas?": {
    options: ["Falta de humedad", "Temperatura en zona de peligro", "Tiempo suficiente", "Nutrientes en el alimento"],
    correctAnswer: 0
  },
  "La acrilamida es una sustancia que se forma en los alimentos cuando:": {
    options: ["Se tuestan o fríen alimentos ricos en almidón a altas temperaturas.", "Se congelan rápidamente.", "Se lavan con cloro.", "Se almacenan en zonas oscuras."],
    correctAnswer: 0
  },
  "¿Cuál bacteria produce la toxina responsable del botulismo?": {
    options: ["Clostridium botulinum", "Salmonella", "Escherichia coli", "Staphylococcus aureus"],
    correctAnswer: 0
  },
  "¿Qué tipo de contaminación ocurre cuando los microorganismos pasan de un alimento crudo a uno cocido?": {
    options: ["Contaminación cruzada", "Contaminación directa", "Contaminación por calor", "Contaminación química"],
    correctAnswer: 0
  },
  "Un hueso pequeño encontrado en un filete de pescado es un ejemplo de contaminación:": {
    options: ["Contaminación física", "Contaminación química", "Contaminación biológica", "Contaminación cruzada"],
    correctAnswer: 0
  },
  "¿Cuál es la principal fuente de contaminación biológica en los alimentos?": {
    options: ["Bacterias, virus y parásitos", "Pesticidas y jabones", "Trozos de vidrio o metal", "Cambios de temperatura bruscos"],
    correctAnswer: 0
  },
  "¿Cuáles son los síntomas más comunes de una ETA?": {
    options: ["Diarrea, vómito y dolores abdominales", "Pérdida de cabello y uñas frágiles", "Dolor de espalda y articulaciones", "Visión borrosa y mareos temporales"],
    correctAnswer: 0
  },
  "¿Cuál es uno de los alimentos de MAYOR riesgo para causar ETA?": {
    options: ["Pollo crudo o mal cocido", "Galletas secas empacadas", "Pan tostado", "Aceite vegetal embotellado"],
    correctAnswer: 0
  },
  "Según las 5 claves de la OMS para alimentos más seguros, ¿cuál es la temperatura correcta para mantener los alimentos calientes?": {
    options: ["Por encima de 60°C", "Alrededor de 40°C", "Por encima de 100°C", "Entre 20°C y 50°C"],
    correctAnswer: 0
  },
  "Un manipulador de alimentos con diarrea o vómito debe:": {
    options: ["Avisar al supervisor y no manipular alimentos", "Usar doble par de guantes", "Tomar medicina y seguir trabajando", "Lavarse las manos con más frecuencia"],
    correctAnswer: 0
  },
  "¿Qué es la hepatitis A en el contexto de las ETA?": {
    options: ["Un virus transmitido frecuentemente por agua contaminada o manipuladores infectados", "Una bacteria que crece en carnes rojas", "Un parásito encontrado en pescados crudos", "Un hongo del pan viejo"],
    correctAnswer: 0
  },
  "¿A qué temperatura debe mantenerse un refrigerador para conservar alimentos correctamente?": {
    options: ["A 4°C o menos", "A 10°C", "A -18°C", "A 15°C"],
    correctAnswer: 0
  }
};

function shuffleAndFindCorrect(options, correctAnswerIndex) {
  const correctOptionText = options[correctAnswerIndex];
  let shuffledOptions = [...options];
  
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
  }

  const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);
  return { shuffledOptions, newCorrectIndex };
}

function findBestMatch(dbQuestionText) {
  if (correctAnswersData[dbQuestionText]) return correctAnswersData[dbQuestionText];
  for (const [key, value] of Object.entries(correctAnswersData)) {
    if (dbQuestionText.toLowerCase().trim() === key.toLowerCase().trim() || 
        dbQuestionText.includes(key.substring(0, 20))) {
      return value;
    }
  }
  return null;
}

async function fixMissingAnswers() {
  const { data: dbQuestions, error: qError } = await supabase.from('questions').select('*');
  
  if (qError) {
    console.error("Error fetching questions:", qError);
    return;
  }

  const { data: allAnswers, error: aError } = await supabase.from('answers').select('questionId, text');
  if (aError) {
    console.error("Error fetching answers:", aError);
    return;
  }

  const answerInfo = {};
  for (const a of allAnswers) {
    if (!answerInfo[a.questionId]) {
      answerInfo[a.questionId] = { count: 0, hasGeneric: false };
    }
    answerInfo[a.questionId].count += 1;
    if (a.text.includes("Opción correcta") || a.text.includes("Segunda opción incorrecta")) {
      answerInfo[a.questionId].hasGeneric = true;
    }
  }

  let insertedCount = 0;

  for (const dbQ of dbQuestions) {
    const info = answerInfo[dbQ.id] || { count: 0, hasGeneric: true };
    
    // Only update if it has generic text
    if (info.hasGeneric) {
      const template = findBestMatch(dbQ.text);
      if (template) {
        console.log(`Seeding real answers for: ${dbQ.text.substring(0, 30)}...`);
        // Delete old answers
        await supabase.from('answers').delete().eq('questionId', dbQ.id);

        const { shuffledOptions, newCorrectIndex } = shuffleAndFindCorrect(template.options, template.correctAnswer);

        const inserts = shuffledOptions.map((opt, idx) => ({
          questionId: dbQ.id,
          text: opt,
          isCorrect: idx === newCorrectIndex
        }));

        const { error: iError } = await supabase.from('answers').insert(inserts);
        if (iError) {
          console.error("Error inserting answers:", iError);
        } else {
          insertedCount += inserts.length;
        }
      } else {
        console.log(`No match for: ${dbQ.text}`);
      }
    }
  }

  console.log(`\n✅ Done! Inserted ${insertedCount} real answers.`);
}

fixMissingAnswers();
