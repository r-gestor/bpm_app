
import * as dotenv from 'dotenv';
dotenv.config(); // Load FIRST

import { OrderService } from './src/lib/services/order.service';
import { supabase } from './src/lib/supabase';

async function testUpdate() {
  console.log('--- Starting OrderService Test ---');
  
  // 1. Find a pending payment for manipulacion-alimentos
  const { data: payments, error: pError } = await supabase
    .from('payments')
    .select('*, products(*)')
    .eq('status', 'PENDING')
    .order('createdAt', { ascending: false });

  if (pError) {
    console.error('Error fetching payments:', pError);
    return;
  }

  const coursePayment = payments?.find(p => (p.products as any)?.slug === 'manipulacion-alimentos');

  if (!coursePayment) {
    console.log('No pending course payments found.');
    const anyPending = payments?.[0];
    if (!anyPending) {
       console.log('TOTAL PAYMENTS IN DB:', (await supabase.from('payments').select('id', { count: 'exact', head: true })).count);
       console.log('No pending payments at all.');
       return;
    }
    console.log(`Using any pending payment: ${anyPending.id} (${(anyPending.products as any)?.slug})`);
    await runTest(anyPending.id);
  } else {
    console.log(`Found pending course payment: ${coursePayment.id}`);
    await runTest(coursePayment.id);
  }
}

async function runTest(id: string) {
  try {
    console.log(`Calling OrderService.updateOrderStatus for ${id} with status APPROVED...`);
    await OrderService.updateOrderStatus(id, 'APPROVED', 'test_tx_id');
    console.log('Call finished successfully.');
    
    // Verify result
    const { data: updated } = await supabase
      .from('payments')
      .select('status')
      .eq('id', id)
      .single();
    
    console.log('New status in DB:', updated?.status);
    
    if (updated?.status === 'APPROVED') {
       console.log('SUCCESS: updateOrderStatus worked correctly.');
    } else {
       console.log('FAILURE: Status did not update correctly.');
    }

    // Revert
    await supabase.from('payments').update({ status: 'PENDING' }).eq('id', id);
    console.log('Reverted to PENDING.');
  } catch (err) {
    console.error('CRITICAL ERROR during test:', err);
  }
}

testUpdate();
