/**
 * Fixes the 5 "catastrophic" questions whose answers don't match the question.
 * Deletes existing answers for each questionId and re-inserts the canonical
 * 4 options (shuffled), marking the correct one.
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FIXES = [
  {
    questionId: '0cb2d527-91c0-48b0-904b-72a4d8003fee',
    label: 'microorganismos beneficiosos',
    options: [
      'Salmonella',
      'Clostridium botulinum',
      'Lactobacillus acidophilus (yogur)',
      'Listeria monocytogenes',
    ],
    correctText: 'Lactobacillus acidophilus (yogur)',
  },
  {
    questionId: '2edeaa53-65cc-4d3b-903d-4852972dfa7c',
    label: 'contaminante químico',
    options: [
      'Un pelo humano',
      'Residuos de pesticidas en frutas y verduras',
      'Una bacteria patógena',
      'Un fragmento de vidrio',
    ],
    correctText: 'Residuos de pesticidas en frutas y verduras',
  },
  {
    questionId: '7d31e796-8783-41f0-bb93-5e12a5717006',
    label: 'señales de contaminación',
    options: [
      'Color brillante y olor agradable',
      'Temperatura adecuada de refrigeración',
      'Cambio de color, olor extraño o textura viscosa',
      'Fecha de vencimiento vigente',
    ],
    correctText: 'Cambio de color, olor extraño o textura viscosa',
  },
  {
    questionId: '058275a1-28bf-40c0-809e-ced44179ca2c',
    label: 'ETA bacteriana',
    options: ['Hepatitis A', 'Salmonelosis', 'Anisakiasis', 'Norovirus'],
    correctText: 'Salmonelosis',
  },
  {
    questionId: 'b32176bb-d01f-4aea-a829-ce70ec8e3691',
    label: 'temperatura alimentos congelados',
    options: ['0°C', '-5°C', '-18°C o menos', '-10°C'],
    correctText: '-18°C o menos',
  },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  for (const fix of FIXES) {
    // Verify the question exists and capture current text
    const { data: q, error: qErr } = await supabase
      .from('questions')
      .select('id, text')
      .eq('id', fix.questionId)
      .maybeSingle();
    if (qErr || !q) {
      console.error(`[${fix.label}] question not found (${fix.questionId})`, qErr);
      continue;
    }
    console.log(`\n[${fix.label}] ${q.text}`);

    // Delete existing answers
    const { error: delErr } = await supabase
      .from('answers')
      .delete()
      .eq('questionId', fix.questionId);
    if (delErr) {
      console.error(`  Delete error:`, delErr);
      continue;
    }

    // Insert new shuffled options
    const shuffled = shuffle(fix.options);
    const inserts = shuffled.map((opt) => ({
      questionId: fix.questionId,
      text: opt,
      isCorrect: opt === fix.correctText,
    }));

    const { error: insErr } = await supabase.from('answers').insert(inserts);
    if (insErr) {
      console.error(`  Insert error:`, insErr);
      continue;
    }

    // Verify
    const { data: verify } = await supabase
      .from('answers')
      .select('text, isCorrect')
      .eq('questionId', fix.questionId);
    const correctCount = verify.filter((a) => a.isCorrect === true).length;
    console.log(`  → ${verify.length} opciones, ${correctCount} correcta(s)`);
    verify.forEach((a) =>
      console.log(`    ${a.isCorrect ? '✓' : ' '} ${a.text}`)
    );
  }
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
