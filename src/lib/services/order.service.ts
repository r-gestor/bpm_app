import { supabase } from "@/lib/supabase";
import { DiscountService } from "./discount.service";
import { AiPlanService } from "./ai-plan.service";

export class OrderService {
  static async findOrCreateUserByEmail(email: string) {
    // 1. Buscar usuario
    const { data: user, error: fError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (user) return user.id;

    // 2. Crear usuario si no existe (cuenta temporal/invitado)
    const { data: newUser, error: cError } = await supabase
      .from('users')
      .insert({
        email,
        name: email.split('@')[0],
        passwordHash: 'GUEST_ACCOUNT', // Se actualizará luego
        role: 'BUYER',
        isActive: true
      })
      .select()
      .maybeSingle();

    if (cError) throw cError;
    return newUser.id;
  }

  static async createOrder(buyerId: string | null, productId: string, quantity: number = 1, discountCode?: string, buyerEmail?: string, planId?: string) {
    // 0. Asegurar buyerId (si es invitado)
    let finalBuyerId = buyerId;
    if (!finalBuyerId && buyerEmail) {
      finalBuyerId = await this.findOrCreateUserByEmail(buyerEmail);
    }

    if (!finalBuyerId) throw new Error("Buyer ID or Email is required");

    // 1. Obtener producto
    const { data: product, error: pError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (pError || !product) throw new Error("Producto no encontrado");

    // 2. Calcular precio base según cantidad (Tiered Pricing)
    let unitPrice = Number(product.price);
    
    // Lógica específica para curso de manipulación de alimentos
    if (product.slug === 'manipulacion-alimentos') {
      if (quantity >= 10) unitPrice = 39000;
      else if (quantity >= 4) unitPrice = 42000;
      else unitPrice = 45000;
    } else if (product.slug === 'plan-saneamiento-iav') {
      unitPrice = 350000;
    }

    const subtotal = unitPrice * quantity;
    let finalPrice = subtotal;
    let discountAmount = 0;
    let appliedDiscountId = null;

    // 3. Validar descuento
    if (discountCode) {
      if (discountCode === "BPM10") {
        discountAmount = (subtotal * 10) / 100;
        finalPrice = subtotal - discountAmount;
      } else {
        const discount = await DiscountService.validateDiscountCode(discountCode);
        if (discount) {
          discountAmount = (subtotal * discount.percentage) / 100;
          finalPrice = subtotal - discountAmount;
          appliedDiscountId = discount.id;
        }
      }
    }

    // 4. Crear orden (Pago)
    const { data: order, error: oError } = await supabase
      .from('payments')
      .insert({
        buyerId: finalBuyerId,
        productId,
        amount: subtotal,
        currency: "COP",
        status: "PENDING",
        quantity,
        discountApplied: discountAmount > 0,
        discountCode: discountCode || null,
        finalAmount: finalPrice
      })
      .select()
      .maybeSingle();

    if (oError) throw oError;

    // Nota: Se eliminó el intento de actualizar la columna 'metadata' en 'sanitation_plans'
    // ya que dicha columna no existe en la base de datos actual.
    // El vínculo se manejará mediante el planId en el flujo de polling/webhook.

    return order;
  }
  static async updateOrderStatus(orderId: string, status: string, transactionId?: string, planId?: string) {
    console.log("[updateOrderStatus] ▶ Input:", { orderId, status, transactionId, planId });

    // 1. Obtener orden actual para saber qué producto se compró
    console.log("[updateOrderStatus] Buscando pago en Supabase con id:", orderId);
    const { data: order, error: fError } = await supabase
      .from('payments')
      .select('*, products(*)')
      .eq('id', orderId)
      .maybeSingle();

    if (fError) {
      console.error("[updateOrderStatus] ❌ Error consultando Supabase:", fError);
      throw new Error("Orden no encontrada");
    }
    if (!order) {
      console.error("[updateOrderStatus] ❌ No existe pago con id:", orderId);
      throw new Error("Orden no encontrada");
    }

    // Extraer slug del producto (manejando si Supabase devuelve objeto o array)
    const productData = Array.isArray(order.products) ? order.products[0] : order.products;
    const productSlug = productData?.slug;

    console.log("[updateOrderStatus] Pago encontrado:", {
      id: order.id,
      currentStatus: order.status,
      newStatus: status,
      productSlug,
      buyerId: order.buyerId,
    });

    // Evitar procesar estados que ya están en un estado final si es una actualización repetida
    if (order.status === 'APPROVED' && status === 'APPROVED') {
      console.log("[updateOrderStatus] Order already APPROVED, skipping.");
      return;
    }

    // 2. Actualizar estado del pago con el valor exacto que llega (APPROVED, DECLINED, etc)
    const updateData: any = { 
      status: status
    };
    
    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    console.log("[updateOrderStatus] Datos a actualizar en Supabase:", updateData);

    const { error: uError, data: updatedObj } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', orderId)
      .select();

    if (uError) {
      console.error("[updateOrderStatus] ❌ Error de Supabase al actualizar pago:", uError);
      throw uError;
    }

    if (!updatedObj || updatedObj.length === 0) {
      console.error("[updateOrderStatus] ❌ UPDATE no afectó ninguna fila. orderId:", orderId);
      throw new Error("No se pudo actualizar el estado del pago (ID no coincide)");
    }

    console.log("[updateOrderStatus] ✅ Pago actualizado en Supabase:", {
      id: updatedObj[0].id,
      status: updatedObj[0].status,
      transactionId: updatedObj[0].transactionId,
    });

    // Actualizar el estado del plan de saneamiento si aplica
    if (productSlug === 'plan-saneamiento-iav' || planId) {
      let targetPlanId = planId;
      
      // Si no tenemos planId, intentamos buscar uno pendiente del usuario
      if (!targetPlanId) {
        const { data: plans } = await supabase
          .from('sanitation_plans')
          .select('id')
          .eq('ownerId', order.buyerId)
          .eq('status', 'PENDING')
          .limit(1);
        if (plans && plans.length > 0) targetPlanId = plans[0].id;
      }

      if (targetPlanId) {
        console.log("[updateOrderStatus] Updating plan status:", { targetPlanId, status });
        const planStatusMap: Record<string, string> = {
          'APPROVED': 'APPROVED',
          'DECLINED': 'DECLINED',
          'ERROR': 'ERROR',
          'VOIDED': 'DECLINED'
        };
        
        const newPlanStatus = planStatusMap[status] || 'PENDING';
        
        if (newPlanStatus !== 'PENDING') {
          const { error: pError, data: pData } = await supabase
            .from('sanitation_plans')
            .update({ 
               status: newPlanStatus
            })
            .eq('id', targetPlanId)
            .select();
          console.log("[updateOrderStatus] Sanitation plan updated:", { pError, pData });
        }
      } else {
        console.warn("[updateOrderStatus] No targetPlanId found to update.");
      }
    }

    // 3. Si el usuario era un ESTUDIANTE, subirlo a COMPRADOR para que vea el dashboard
    if (status === 'APPROVED') {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', order.buyerId)
        .maybeSingle();

      if (userData?.role === 'STUDENT') {
        await supabase
          .from('users')
          .update({ role: 'BUYER' })
          .eq('id', order.buyerId);
      }

      // 4. Si fue un PLAN DE SANEAMIENTO, activar el plan aprobado con IA
      if (productSlug === 'plan-saneamiento-iav') {
        const { data: plans } = await supabase
          .from('sanitation_plans')
          .select('id')
          .eq('ownerId', order.buyerId)
          .eq('status', 'APPROVED');

        if (plans) {
          for (const plan of plans) {
            // Esto genera el plan usando RAG y lo marca como COMPLETED
            await AiPlanService.generateFullPlan(plan.id);
          }
        }
      }
    }
  }
}
