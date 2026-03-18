import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { AiPlanService } from '@/lib/services/ai-plan.service';

const PLAN_ID = process.argv[2] || '71cd7624-30f7-47b0-8d0b-f595843c6e72';

async function main() {
  console.log(`[regenerate-pdf] Regenerando PDF para plan: ${PLAN_ID}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verificar que el plan existe
  const { data: plan, error } = await supabase
    .from('sanitation_plans')
    .select('id, generation_status, businessName')
    .eq('id', PLAN_ID)
    .single();

  if (error || !plan) {
    console.error('[regenerate-pdf] Plan no encontrado:', error?.message);
    process.exit(1);
  }

  console.log(`[regenerate-pdf] Plan encontrado: ${plan.businessName} (status: ${plan.generation_status})`);

  // Forzar status a content_ready para permitir regeneración
  if (plan.generation_status !== 'content_ready' && plan.generation_status !== 'partial_error') {
    console.log(`[regenerate-pdf] Actualizando status a content_ready...`);
    await supabase
      .from('sanitation_plans')
      .update({ generation_status: 'content_ready' })
      .eq('id', PLAN_ID);
  }

  // Generar PDF
  const result = await AiPlanService.generatePdf(PLAN_ID);

  if (result.success) {
    console.log(`[regenerate-pdf] ✅ PDF generado exitosamente`);
    console.log(`[regenerate-pdf] URL: ${result.pdfUrl}`);
  } else {
    console.error(`[regenerate-pdf] ❌ Error generando PDF: ${result.error}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[regenerate-pdf] Error fatal:', err);
  process.exit(1);
});
