const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const correctAnswersData = {
  "¿Qué es la cadena de frío?": {
    options: [
      "Mantenimiento ininterrumpido de la temperatura adecuada desde la producción hasta el consumo.",
      "Guardar los alimentos en la nevera por un día.",
      "Congelar y descongelar varias veces.",
      "Transportar alimentos en camiones especiales."
    ],
    correctAnswer: 0
  },
  "¿Cuál es la temperatura máxima permitida para el almacenamiento de carnes frías?": {
    options: ["4°C", "10°C", "15°C", "0°C"],
    correctAnswer: 0
  },
  "¿Qué método de descongelación NO está permitido según las BPM?": {
    options: [
      "A temperatura ambiente.",
      "En el refrigerador.",
      "En horno microondas (para cocción inmediata).",
      "Bajo chorro de agua fría continua."
    ],
    correctAnswer: 0
  },
  "¿Cuál de los siguientes es un método común de conservación por calor?": {
    options: ["Pasteurización", "Congelación", "Liofilización", "Salazón"],
    correctAnswer: 0
  },
  "¿Qué significa el sistema PEPS (Primeras Entradas, Primeras Salidas)?": {
    options: [
      "Los productos más antiguos deben usarse primero.",
      "Los productos más nuevos deben usarse primero.",
      "Ordenar los productos alfabéticamente.",
      "Los productos deben ordenarse por tamaño."
    ],
    correctAnswer: 0
  },
  "¿Qué información DEBE tener obligatoriamente el etiquetado de un alimento según las BPM?": {
    options: [
      "Fecha de vencimiento y lote.",
      "Solo el nombre del producto.",
      "El precio de venta.",
      "El nombre del vendedor."
    ],
    correctAnswer: 0
  },
  "¿Qué método de conservación utiliza altas concentraciones de azúcar?": {
    options: ["Almíbar", "Salmuera", "Ahumado", "Fermentación"],
    correctAnswer: 0
  },
  "¿Cuántos pasos tiene el correcto lavado de manos según la OMS?": {
    options: ["11 pasos", "5 pasos", "3 pasos", "7 pasos"],
    correctAnswer: 0
  },
  "¿Cuándo es OBLIGATORIO lavarse las manos?": {
    options: [
      "Después de ir al baño, toser o manipular basura.",
      "Solo antes de empezar el turno.",
      "Únicamente antes de comer.",
      "Al terminar el turno de trabajo."
    ],
    correctAnswer: 0
  },
  "¿Para qué sirven los guantes en la manipulación de alimentos?": {
    options: [
      "Son una barrera adicional, pero no reemplazan el lavado de manos.",
      "Para evitar lavarse las manos.",
      "Para limpiar mejor las superficies.",
      "Para manipular objetos calientes exclusivamente."
    ],
    correctAnswer: 0
  },
  "¿Qué debe hacer un manipulador de alimentos si tiene una herida en la mano?": {
    options: [
      "Cubrirla con apósito impermeable y usar guante.",
      "Dejarla destapada para que sane rápido.",
      "Irse a casa y no trabajar.",
      "Lavarla constantemente con alcohol."
    ],
    correctAnswer: 0
  },
  "¿Cuál es la diferencia entre limpieza y desinfección?": {
    options: [
      "Limpieza quita suciedad visible, desinfección reduce microorganismos.",
      "Son exactamente lo mismo.",
      "Desinfección quita suciedad visible, limpieza reduce microorganismos.",
      "Limpieza usa cloro, desinfección usa jabón."
    ],
    correctAnswer: 0
  },
  "¿Cuál es el orden correcto del proceso de higienización?": {
    options: [
      "Limpiar, enjuagar, desinfectar, enjuagar y secar.",
      "Desinfectar, limpiar, secar.",
      "Secar, limpiar, desinfectar.",
      "Solo limpiar y secar."
    ],
    correctAnswer: 0
  },
  "¿Cuál es la mejor manera de prevenir el ingreso de plagas a la zona de proceso?": {
    options: [
      "Instalar mallas en ventanas y mantener puertas cerradas/con cortinas.",
      "Dejar comida afuera para que coman y se vayan.",
      "Tener gastos y perros en la cocina.",
      "Usar insecticidas mientras se preparan los alimentos."
    ],
    correctAnswer: 0
  },
  "¿Qué tipo de contenedor es el adecuado para residuos en zonas de manipulación de alimentos?": {
    options: [
      "Con tapa accionada por pedal y bolsa plástica.",
      "Cajas de cartón.",
      "Baldes abiertos sin tapa.",
      "Bolsas plásticas sueltas en el piso."
    ],
    correctAnswer: 0
  },
  "¿Qué significan las siglas BPM en la industria alimentaria colombiana?": {
    options: [
      "Buenas Prácticas de Manufactura.",
      "Buenos Productos Manufactureros.",
      "Base para Preparación Mejorada.",
      "Bloque de Procesamiento de Materias."
    ],
    correctAnswer: 0
  },
  "¿Cuántos principios tiene el sistema HACCP?": {
    options: ["7 principios.", "3 principios.", "10 principios.", "5 principios."],
    correctAnswer: 0
  },
  "¿Qué es un Punto Crítico de Control (PCC) en el sistema HACCP?": {
    options: [
      "Una etapa donde se puede aplicar un control esencial para prevenir o eliminar un peligro.",
      "El momento de pagar los alimentos.",
      "La zona de recepción del restaurante.",
      "Un punto donde la comida se ve mal."
    ],
    correctAnswer: 0
  },
  "¿Qué es la trazabilidad en la industria alimentaria?": {
    options: [
      "Rastrear un alimento a través de todas sus etapas de producción, transformación y distribución.",
      "Trazar líneas en el piso para organizar el almacén.",
      "El diseño gráfico de las etiquetas de los alimentos.",
      "El proceso de cortar los ingredientes en trozos uniformes."
    ],
    correctAnswer: 0
  },
  "¿Cuál es el primer principio del sistema HACCP?": {
    options: [
      "Realizar un análisis de peligros.",
      "Determinar los Puntos Críticos de Control.",
      "Establecer límites críticos.",
      "Establecer procedimientos de verificación."
    ],
    correctAnswer: 0
  },
  "¿Qué entidad en Colombia supervisa el cumplimiento de la Resolución 2674 de 2013?": {
    options: [
      "INVIMA.",
      "DIAN.",
      "Ministerio de Educación.",
      "Secretaría de Tránsito."
    ],
    correctAnswer: 0
  },
  "¿Cuál es la diferencia entre alergia alimentaria e intolerancia alimentaria?": {
    options: [
      "La alergia involucra al sistema inmunológico, la intolerancia afecta al sistema digestivo.",
      "Son términos diferentes para la misma condición.",
      "La intolerancia es grave y la alergia es leve.",
      "Las alergias se curan cocinando más el alimento."
    ],
    correctAnswer: 0
  },
  "¿Cuántos alérgenos de declaración obligatoria exige la normativa colombiana en el etiquetado?": {
    options: [
      "14 grupos principales.",
      "5 grupos.",
      "20 alimentos específicos.",
      "Ninguno, no hay normativa sobre esto."
    ],
    correctAnswer: 0
  },
  "¿Cuál de los siguientes es uno de los 14 alérgenos de declaración obligatoria?": {
    options: [
      "Maní (cacahuetes).",
      "Pollo.",
      "Arroz.",
      "Manzana."
    ],
    correctAnswer: 0
  },
  "¿Qué es la anafilaxia?": {
    options: [
      "Una reacción alérgica grave que puede ser mortal.",
      "Una técnica de cocción al vacío.",
      "Un tipo de bacteria común en lácteos.",
      "Un conservante autorizado para carnes."
    ],
    correctAnswer: 0
  },
  "¿Cómo se puede prevenir la contaminación cruzada por alérgenos en la cocina?": {
    options: [
      "Usando utensilios separados y limpieza rigurosa.",
      "Lavando los alergenos con agua caliente.",
      "Cocinando el alimento alérgeno por más tiempo.",
      "Solo separándolos visualmente en la misma tabla."
    ],
    correctAnswer: 0
  },
  "¿Cuál es la definición de manipulador de alimentos según la normativa colombiana?": {
    options: [
      "Toda persona que interviene directamente en, aunque sea, una sola de las actividades de procesamiento de alimentos.",
      "Solo el chef principal del establecimiento.",
      "Únicamente los encargados de transportar la mercancía.",
      "Personal administrativo del restaurante."
    ],
    correctAnswer: 0
  },
  "¿Qué microorganismo es el principal indicador de contaminación fecal en alimentos y agua?": {
    options: [
      "Escherichia coli (E. coli)",
      "Lactobacillus",
      "Saccharomyces cerevisiae",
      "Penicillium"
    ],
    correctAnswer: 0
  },
  "¿Cuál es la función principal de los aditivos conservantes en alimentos?": {
    options: [
      "Prolongar la vida útil del alimento previniendo el deterioro por microorganismos.",
      "Darle color artificial al alimento.",
      "Aumentar el valor nutricional del producto.",
      "Reemplazar el azúcar en las recetas."
    ],
    correctAnswer: 0
  },
  "¿Las bacterias patógenas siempre cambian el olor, color o sabor del alimento contaminado?": {
    options: [
      "Falso, los alimentos pueden verse y oler normales a pesar de la presencia de bacterias patógenas.",
      "Verdadero, siempre se notará el alimento descompuesto.",
      "Solo cambian el sabor, pero no el olor.",
      "Depende de la cantidad de luz que reciba el alimento."
    ],
    correctAnswer: 0
  },
  "¿Qué es el botulismo?": {
    options: [
      "Una intoxicación grave causada por la toxina de la bacteria Clostridium botulinum, frecuentemente asociada a enlatados defectuosos.",
      "Una enfermedad causada por comer demasiada azúcar.",
      "Una alergia al polvo que se desarrolla en los restaurantes.",
      "Un método de conservación obsoleto."
    ],
    correctAnswer: 0
  },
  "¿Cuál es el propósito principal del escaldado de vegetales antes de la congelación?": {
    options: [
      "Inactivar enzimas que causarían pérdida de calidad durante la congelación.",
      "Darle un sabor más dulce a las legumbres.",
      "Evitar que se encojan en la nevera.",
      "Cocinar completamente el alimento antes de envasar."
    ],
    correctAnswer: 0
  },
  "¿Qué debe incluir un plan de saneamiento obligatorio según las BPM?": {
    options: [
      "Programas de limpieza y desinfección, manejo integral de residuos, y control de plagas.",
      "Solo un cronograma de recolección de basuras.",
      "Los menús ofrecidos durante el mes.",
      "El inventario de las sillas y mesas del local."
    ],
    correctAnswer: 0
  },
  "¿Con qué frecuencia mínima se deben retirar los residuos sólidos de las áreas de manipulación de alimentos?": {
    options: [
      "Las veces que sea necesario, o al finalizar el trabajo cada vez que se llenen los recipientes.",
      "Una vez a la semana.",
      "Solo cuando llegue el camión recolector.",
      "No hay una frecuencia establecida, a criterio del dueño."
    ],
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
  // exact match
  if (correctAnswersData[dbQuestionText]) return correctAnswersData[dbQuestionText];
  
  // fuzzy match
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

  // Get questions that don't have enough answers or have generic answers
  const { data: allAnswers, error: aError } = await supabase.from('answers').select('questionId, text');
  if (aError) {
    console.error("Error fetching answers:", aError);
    return;
  }

  // Group by questionId and check if generic
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
    
    // Only update if it has < 4 or has generic text
    if (info.count < 4 || info.hasGeneric) {
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
