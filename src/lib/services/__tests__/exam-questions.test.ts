/**
 * Tests mínimos para la lógica de construcción de preguntas de examen.
 * Ejecutar: npx tsx src/lib/services/__tests__/exam-questions.test.ts
 *
 * Cubre: caso normal, opciones mezcladas, respuesta duplicada,
 *        datos faltantes, y consistencia de índices.
 */

// ─── Helpers extraídos (misma lógica que los servicios) ───

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sortById<T extends { id: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

interface Answer { id: string; text: string; isCorrect: boolean }
interface Question { id: string; text: string; answers: Answer[] }

function isValidQuestion(q: Question): boolean {
  const answers = q.answers || [];
  if (answers.length < 2) return false;
  const correctCount = answers.filter(a => a.isCorrect === true).length;
  return correctCount === 1;
}

function buildOptions(q: Question) {
  const sorted = sortById(q.answers);
  const correctIdx = sorted.findIndex(a => a.isCorrect === true);
  return {
    options: sorted.map(a => a.text),
    correctAnswerIndex: correctIdx
  };
}

// ─── Test runner ───

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

// ─── Test data ───

const VALID_QUESTION: Question = {
  id: "q1",
  text: "¿Qué es contaminación cruzada?",
  answers: [
    { id: "a3", text: "Cocinar demasiado", isCorrect: false },
    { id: "a1", text: "Paso de microorganismos", isCorrect: true },
    { id: "a2", text: "Lavar con agua fría", isCorrect: false },
    { id: "a4", text: "Ninguna de las anteriores", isCorrect: false },
  ]
};

const NO_CORRECT: Question = {
  id: "q2",
  text: "Pregunta sin respuesta correcta",
  answers: [
    { id: "a1", text: "Opción A", isCorrect: false },
    { id: "a2", text: "Opción B", isCorrect: false },
  ]
};

const MULTIPLE_CORRECT: Question = {
  id: "q3",
  text: "Pregunta con múltiples correctas",
  answers: [
    { id: "a1", text: "Opción A", isCorrect: true },
    { id: "a2", text: "Opción B", isCorrect: true },
  ]
};

const SINGLE_OPTION: Question = {
  id: "q4",
  text: "Solo una opción",
  answers: [
    { id: "a1", text: "Única", isCorrect: true },
  ]
};

const NO_OPTIONS: Question = {
  id: "q5",
  text: "Sin opciones",
  answers: []
};

// ─── Tests ───

console.log("\n1. Validación de preguntas");
assert(isValidQuestion(VALID_QUESTION) === true, "Pregunta válida (4 opciones, 1 correcta) → aceptada");
assert(isValidQuestion(NO_CORRECT) === false, "Sin respuesta correcta → rechazada");
assert(isValidQuestion(MULTIPLE_CORRECT) === false, "Múltiples correctas → rechazada");
assert(isValidQuestion(SINGLE_OPTION) === false, "Solo 1 opción → rechazada");
assert(isValidQuestion(NO_OPTIONS) === false, "Sin opciones → rechazada");

console.log("\n2. Respuesta correcta siempre en opciones");
const { options, correctAnswerIndex } = buildOptions(VALID_QUESTION);
assert(correctAnswerIndex >= 0, "correctAnswerIndex no es -1");
assert(correctAnswerIndex < options.length, "correctAnswerIndex dentro de rango");
assert(options[correctAnswerIndex] === "Paso de microorganismos", "La opción correcta coincide con el texto correcto");

console.log("\n3. Orden determinista por ID");
const sorted = sortById(VALID_QUESTION.answers);
assert(sorted[0].id === "a1", "Primera opción tiene ID menor");
assert(sorted[sorted.length - 1].id === "a4", "Última opción tiene ID mayor");

// Repetir 100 veces para verificar estabilidad
let consistent = true;
for (let i = 0; i < 100; i++) {
  const { correctAnswerIndex: idx } = buildOptions(VALID_QUESTION);
  if (idx !== correctAnswerIndex) { consistent = false; break; }
}
assert(consistent, "correctAnswerIndex es estable en 100 iteraciones");

console.log("\n4. Fisher-Yates shuffle produce permutaciones variadas");
const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const results = new Set<string>();
for (let i = 0; i < 50; i++) {
  results.add(shuffleArray(original).join(","));
}
assert(results.size > 5, `Shuffle produce ${results.size} permutaciones distintas en 50 intentos`);

// Verificar que shuffle no muta el original
const copy = [...original];
shuffleArray(copy);
assert(JSON.stringify(copy) === JSON.stringify(original), "Shuffle no muta el array original");

console.log("\n5. Consistencia GET/POST — simulación de flujo completo");
// Simular getExamQuestions (GET)
const getResult = buildOptions(VALID_QUESTION);

// Simular submitExam (POST) — re-ordena por ID y busca correcta
const postAnswers = sortById(VALID_QUESTION.answers);
const postCorrectIdx = postAnswers.findIndex(a => a.isCorrect === true);

assert(getResult.correctAnswerIndex === postCorrectIdx,
  "GET y POST producen el mismo correctAnswerIndex");
assert(getResult.options[getResult.correctAnswerIndex] === postAnswers[postCorrectIdx].text,
  "El texto correcto coincide entre GET y POST");

// ─── Resumen ───

console.log(`\n${"═".repeat(40)}`);
console.log(`Resultado: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
