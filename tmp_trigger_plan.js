
const { AiPlanService } = require('./src/lib/services/ai-plan.service');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function run() {
  const planId = '71cd7624-30f7-47b0-8d0b-f595843c6e72';
  console.log(`[Manual Trigger] Starting generation for plan ${planId}`);
  try {
    const success = await AiPlanService.generatePlanForUser(planId);
    console.log('[Manual Trigger] Result:', success ? 'SUCCESS' : 'FAILURE');
  } catch (err) {
    console.error('[Manual Trigger] Unexpected Error:', err);
  }
}

run();
