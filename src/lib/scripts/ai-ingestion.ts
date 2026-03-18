import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const voyageApiKey = process.env.VOYAGE_API_KEY!;

if (!voyageApiKey) {
  console.error("ERROR: VOYAGE_API_KEY no encontrada en el archivo .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Función helper para generar embeddings con Voyage AI
 */
async function getEmbedding(text: string) {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageApiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-3",
    }),
  });

  const data = await response.json();
  if (!data.data || !data.data[0]) {
    throw new Error(`Error de Voyage AI: ${JSON.stringify(data)}`);
  }
  return data.data[0].embedding;
}

const DOCUMENTS_DIR = path.join(process.cwd(), 'contexto_plan_saneamiento');

async function processFiles() {
  console.log("--- Iniciando ingesta de conocimiento para RAG (Voyage AI) ---");
  
  const files = fs.readdirSync(DOCUMENTS_DIR).filter(f => f.endsWith('.txt'));
  
  for (const file of files) {
    const filePath = path.join(DOCUMENTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    console.log(`Procesando archivo: ${file}...`);
    
    const chunks = content.split(/\n\s*\n/).filter(c => c.trim().length > 50);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i].trim();
      
      try {
        // Delay de 22 segundos para respetar el límite de 3 RPM (peticiones por minuto) de la cuenta gratuita de Voyage
        console.log(`\nEsperando para procesar chunk ${i}...`);
        await new Promise(resolve => setTimeout(resolve, 22000));

        // 1. Generar embedding con Voyage
        const embedding = await getEmbedding(chunk);
        
        // 2. Guardar en Supabase
        const { error } = await supabase
          .from('sanitation_knowledge')
          .insert({
            content: chunk,
            metadata: {
              source: file,
              chunk_index: i
            },
            embedding: embedding
          });
          
        if (error) {
          console.error(`Error guardando chunk ${i} de ${file}:`, error.message);
        } else {
          process.stdout.write(".");
        }
      } catch (err: any) {
        console.error(`Error procesando chunk ${i} de ${file}: ${err.message}`);
      }
    }
    console.log(`\nArchivo ${file} completado.`);
  }
  
  console.log("--- Ingesta finalizada con éxito ---");
}

processFiles().catch(err => {
  console.error("Error fatal en la ingesta:", err);
});
