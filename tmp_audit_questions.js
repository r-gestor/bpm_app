/**
 * Audits the questions/answers in Supabase against the canonical question.json.
 * Prints any DB question whose answer set or correct answer differs from the source.
 * READ-ONLY — does not mutate anything.
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const canonical = JSON.parse(fs.readFileSync('./question.json', 'utf8')).preguntas;

const normalize = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[¿?¡!.,:;"']/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function findCanonical(dbText) {
  const target = normalize(dbText);
  // Exact normalized match first
  let exact = canonical.find((c) => normalize(c.pregunta) === target);
  if (exact) return { match: exact, kind: 'exact' };
  // Then containment in either direction
  let contains = canonical.find(
    (c) =>
      normalize(c.pregunta).includes(target) ||
      target.includes(normalize(c.pregunta))
  );
  if (contains) return { match: contains, kind: 'contains' };
  return null;
}

async function main() {
  const { data: questions, error: qErr } = await supabase
    .from('questions')
    .select('id, text, answers:answers(id, text, isCorrect)');

  if (qErr) {
    console.error('Error loading questions:', qErr);
    process.exit(1);
  }

  console.log(`Loaded ${questions.length} DB questions, ${canonical.length} canonical questions.\n`);

  const mismatches = [];
  const unmatched = [];

  for (const q of questions) {
    const found = findCanonical(q.text);
    if (!found) {
      unmatched.push(q);
      continue;
    }
    const canon = found.match;
    const canonOptions = Object.values(canon.opciones); // [A, B, C, D]
    const canonCorrectText = canon.opciones[canon.respuesta_correcta];

    const dbOptionTexts = (q.answers || []).map((a) => a.text);
    const dbCorrect = (q.answers || []).find((a) => a.isCorrect === true);
    const dbCorrectText = dbCorrect ? dbCorrect.text : '(NONE)';

    // Compare option SETS, ignoring trivial punctuation/whitespace
    const canonNorm = canonOptions.map(normalize).sort();
    const dbNorm = dbOptionTexts.map(normalize).sort();
    const optsMatch =
      canonNorm.length === dbNorm.length &&
      canonNorm.every((t, i) => t === dbNorm[i]);

    // Correct-answer comparison: also try matching the normalized DB-correct
    // against the normalized canonical correct.
    const correctMatch = normalize(dbCorrectText) === normalize(canonCorrectText);

    if (!optsMatch || !correctMatch) {
      mismatches.push({
        questionId: q.id,
        questionText: q.text,
        canonOptions,
        canonCorrect: canonCorrectText,
        dbOptions: dbOptionTexts,
        dbCorrect: dbCorrectText,
        optsMatch,
        correctMatch,
        matchKind: found.kind,
      });
    }
  }

  console.log(`MISMATCHES: ${mismatches.length}\n`);
  for (const m of mismatches) {
    console.log('━'.repeat(80));
    console.log(`Q [${m.questionId}] (matched via ${m.matchKind})`);
    console.log(`  Pregunta: ${m.questionText}`);
    console.log(`  Canon opciones: ${JSON.stringify(m.canonOptions)}`);
    console.log(`  DB    opciones: ${JSON.stringify(m.dbOptions)}`);
    console.log(`  Canon correcta: ${m.canonCorrect}`);
    console.log(`  DB    correcta: ${m.dbCorrect}`);
    console.log(`  optsMatch=${m.optsMatch} correctMatch=${m.correctMatch}`);
  }

  console.log('\n' + '━'.repeat(80));
  console.log(`UNMATCHED DB questions (no canonical found): ${unmatched.length}`);
  for (const u of unmatched) {
    console.log(` - [${u.id}] ${u.text.substring(0, 100)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
