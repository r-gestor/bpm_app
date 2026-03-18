require('dotenv').config();
const { AiPlanService } = require('./src/lib/services/ai-plan.service');

async function test() {
  const planId = '71cd7624-30f7-47b0-8d0b-f595843c6e72';
  console.log(`[TEST] Iniciando Phase 1 para plan: ${planId}`);
  
  try {
    const result = await AiPlanService.generateContent(planId);
    console.log('[TEST] Resultado de Phase 1:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('[TEST] Error fatal en la prueba:', error);
  }
}

test();
