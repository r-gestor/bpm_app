import { supabase } from "@/lib/supabase";

export class SanitationService {
  /**
   * Genera un plan de saneamiento basado en los datos del negocio.
   */
  static async generatePlan(businessData: any, ownerId: string) {
    // 1. Seleccionar la mejor plantilla según el tipo de establecimiento
    // Mapeo flexible para el tipo
    const type = businessData.establishmentType || businessData.type || "PREPARACION";
    
    const { data: template, error: tError } = await supabase
      .from('sanitation_templates')
      .select('*')
      .eq('type', type)
      .maybeSingle();

    const baseContent: any = template?.content || {};

    // 2. Personalización profunda basada en las nuevas preguntas
    const equipmentList = typeof businessData.equipment === 'string' 
      ? businessData.equipment 
      : (businessData.equipment?.join?.(", ") || "equipos generales");

    const highRiskNotes = businessData.hasHighRiskFoods === "Sí" 
      ? "\n\n⚠️ NOTA: El manejo de carnes/lácteos requiere protocolos de desinfección reforzados." 
      : "";

    const deliveryNotes = businessData.hasDelivery 
      ? "\n\n📦 PROTOCOLO DOMICILIOS: Se debe garantizar la cadena de frío y empaques sellados durante el transporte." 
      : "";

    const generatedPlan = {
      cleaning: `${baseContent.cleaning || "Limpieza estándar profunda de superficies."}\n\nDetalle específico: Se realizará desinfección diaria de ${equipmentList}.${highRiskNotes}`,
      pests: baseContent.pests || "Manejo integrado de plagas (MIP) mensual.",
      waste: `${baseContent.waste || "Manejo de residuos sólidos y líquidos."}\n\nDistribución en áreas: ${businessData.spaces || "Área general"}.${deliveryNotes}`,
      hygiene: `${baseContent.hygiene || "Protocolo de higiene y hábitos del personal."}\n\nProductos comercializados: ${businessData.products || "Alimentos varios"}`,
      schedule: "Lunes y Jueves: Limpieza profunda de equipos. Diario: Limpieza de áreas comunes.",
      records: "Control de temperatura (si aplica), Formato de limpieza y desinfección.",
    };

    // 3. Empaquetar todo para persistencia (Plan + Respuestas originales)
    const fullContent = {
      ...generatedPlan,
      rawAnswers: {
        address: businessData.address,
        nit: businessData.nit,
        ownerName: businessData.ownerName,
        products: businessData.products,
        equipment: businessData.equipment,
        spaces: businessData.spaces,
        hasDelivery: businessData.hasDelivery,
        hasHighRiskFoods: businessData.hasHighRiskFoods,
        logoUrl: businessData.logoPreview, // Guardamos el preview como referencia visual
      }
    };

    // 4. Crear el registro en la base de datos
    const { data: plan, error: pError } = await supabase
      .from('sanitation_plans')
      .insert({
        ownerId,
        businessName: businessData.businessName,
        establishmentType: type,
        status: "PENDING",
        content: fullContent,
        verificationHash: `plan_${Math.random().toString(36).substring(7)}`,
        certificateCode: `SAN-${Date.now()}`
      })
      .select()
      .single();

    if (pError) throw pError;
    return plan;
  }

  /**
   * Obtiene todos los planes de saneamiento de un usuario.
   */
  static async getUserPlans(ownerId: string) {
    const { data, error } = await supabase
      .from('sanitation_plans')
      .select('*')
      .eq('ownerId', ownerId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  }
}
