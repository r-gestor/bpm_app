import { supabase } from "@/lib/supabase";

export class SanitationService {
  /**
   * Sube una imagen base64 a Supabase Storage y retorna la URL pública.
   */
  private static async uploadLogoToStorage(
    base64DataUrl: string,
    ownerId: string
  ): Promise<string | null> {
    try {
      // Extraer mime type y datos del data URL
      const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match) {
        console.warn("[SanitationService] Logo base64 inválido, no se puede subir.");
        return null;
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const ext = mimeType.split("/")[1] || "png";
      const buffer = Buffer.from(base64Data, "base64");
      const fileName = `logos/${ownerId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("sanitation-assets")
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.error("[SanitationService] Error subiendo logo:", uploadError.message);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from("sanitation-assets")
        .getPublicUrl(fileName);

      console.log("[SanitationService] Logo subido:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error("[SanitationService] Error inesperado subiendo logo:", err.message);
      return null;
    }
  }

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

    // 3. Subir logo a Storage si existe (en vez de guardar base64 en content)
    let logoUrl: string | null = null;
    if (businessData.logoPreview && businessData.logoPreview.startsWith("data:")) {
      logoUrl = await this.uploadLogoToStorage(businessData.logoPreview, ownerId);
    }

    // 4. Empaquetar todo para persistencia (Plan + Respuestas originales)
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
        logoUrl: logoUrl || null,
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
