
const { createClient } = require('@supabase/supabase-js');

// Use Service Role Key for full access
const supabase = createClient(
  "https://dlnbvcfsnyxhjwurqakm.supabase.co", 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsbmJ2Y2Zzbnl4aGp3dXJxYWttIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzA3ODcyOCwiZXhwIjoyMDg4NjU0NzI4fQ.Jgn86X9lxJlzBFfPArBvcr1SAgBvk1O-K6qQ6KkUxuQ"
);

const PDF_FILES = [
  { name: "1. Introducción" },
  { id: "2", name: "2. Higiene Alimentaria" },
  { id: "3", name: "3. Enfermedades de Transmisión Alimentaria" },
  { id: "4", name: "4. Conservación y Almacenamiento de Alimentos" },
  { id: "5", name: "5. Limpieza e Higiene del Establecimiento" },
  { id: "6", name: "6. Higiene de los Manipuladores" },
  { id: "7", name: "7. Contaminación de los Alimentos" },
  { id: "8", name: "8. Buenas Prácticas de Manufactura y Sistema HACCP" },
];

async function updateModules() {
  // 1. Get the correct course ID
  const { data: product } = await supabase.from('products').select('id').eq('slug', 'manipulacion-alimentos').single();
  if (!product) {
    console.error("Product not found");
    return;
  }

  const { data: course } = await supabase.from('courses').select('id').eq('productId', product.id).single();
  if (!course) {
    console.error("Course not found");
    return;
  }

  console.log(`Updating course ${course.id}...`);

  // 2. Clear old lessons
  const { error: delError } = await supabase.from('course_videos').delete().eq('courseId', course.id);
  if (delError) {
    console.error("Error deleting old videos:", delError);
    return;
  }

  // 3. Insert 8 new lessons
  for (let i = 0; i < PDF_FILES.length; i++) {
    const { error: insError } = await supabase.from('course_videos').insert({
      courseId: course.id,
      title: PDF_FILES[i].name,
      url: '', 
      duration: 0,
      order: i + 1
    });
    if (insError) {
      console.error(`Error inserting lesson ${i+1}:`, insError);
    }
  }

  // 4. Update totalLessons count in course
  await supabase.from('courses').update({ totalLessons: 8 }).eq('id', course.id);

  console.log("Successfully updated to 8 lessons.");
}

updateModules();
