import { supabase } from "@/lib/supabase";
import puppeteer from "puppeteer";
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { generateSanitationCode } from "@/lib/crypto/codes";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Estados de generación del plan:
 * - "pending"           → Plan creado, esperando generación
 * - "generating"        → Generando contenido con Claude
 * - "content_ready"     → Contenido generado, listo para PDF
 * - "generating_pdf"    → Generando PDF con Puppeteer
 * - "completed"         → PDF generado y guardado en Supabase
 * - "partial_error"     → Algunas secciones fallaron
 * - "error"             → Error fatal en la generación
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ContentGenerationResult {
  success: boolean;
  sectionsCompleted: number;
  sectionsTotal: number;
  errors: string[];
}

interface PdfGenerationResult {
  success: boolean;
  pdfUrl: string | null;
  error: string | null;
}

interface FullPlanResult {
  success: boolean;
  contentResult: ContentGenerationResult;
  pdfResult: PdfGenerationResult | null;
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

export class AiPlanService {
  // ─── Embedding & RAG ────────────────────────────────────────────────────────

  private static async getEmbedding(text: string) {
    try {
      const response = await fetch("https://api.voyageai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        },
        body: JSON.stringify({ input: text, model: "voyage-3" }),
      });
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error("[AiPlanService] Error generando embedding:", error);
      throw error;
    }
  }

  private static async matchKnowledge(query: string, limit = 3) {
    try {
      const embedding = await this.getEmbedding(query);
      const { data, error } = await supabase.rpc("match_sanitation_knowledge", {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: limit,
      });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[AiPlanService] Error buscando conocimiento:", error);
      return [];
    }
  }

  // ─── Llamada base a Claude ──────────────────────────────────────────────────

  // ─── Batch API helpers ──────────────────────────────────────────────────────

  private static readonly ANTHROPIC_HEADERS = () => ({
    "x-api-key": process.env.ANTHROPIC_API_KEY || "",
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  });

  private static async submitBatch(
    requests: Array<{
      custom_id: string;
      params: {
        model: string;
        max_tokens: number;
        system: string;
        messages: Array<{ role: string; content: string }>;
      };
    }>
  ): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages/batches", {
      method: "POST",
      headers: this.ANTHROPIC_HEADERS(),
      body: JSON.stringify({ requests }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Batch submit ${response.status}: ${errText.substring(0, 300)}`);
    }

    const data = await response.json();
    console.log(`[AiPlanService] Batch creado: ${data.id} (${requests.length} solicitudes)`);
    return data.id as string;
  }

  private static async pollBatchUntilDone(batchId: string): Promise<void> {
    const MAX_WAIT_MS = 2 * 60 * 60 * 1000; // 2 horas
    const POLL_INTERVAL_MS = 30_000; // 30 segundos
    const start = Date.now();

    while (Date.now() - start < MAX_WAIT_MS) {
      await delay(POLL_INTERVAL_MS);

      const response = await fetch(
        `https://api.anthropic.com/v1/messages/batches/${batchId}`,
        { headers: this.ANTHROPIC_HEADERS() }
      );

      if (!response.ok) {
        console.warn(`[AiPlanService] Poll error ${response.status}, reintentando...`);
        continue;
      }

      const data = await response.json();
      const counts = data.request_counts || {};
      console.log(
        `[AiPlanService] Batch ${batchId} — estado: ${data.processing_status} | ` +
        `procesando: ${counts.processing ?? "?"}, éxito: ${counts.succeeded ?? "?"}, error: ${counts.errored ?? "?"}`
      );

      if (data.processing_status === "ended") return;
    }

    throw new Error(`Batch ${batchId} no terminó en 2 horas`);
  }

  private static async getBatchResults(batchId: string): Promise<Map<string, string>> {
    const response = await fetch(
      `https://api.anthropic.com/v1/messages/batches/${batchId}/results`,
      { headers: this.ANTHROPIC_HEADERS() }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Batch results ${response.status}: ${errText.substring(0, 300)}`);
    }

    const text = await response.text();
    const results = new Map<string, string>();

    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      try {
        const item = JSON.parse(line);
        if (item.result?.type === "succeeded") {
          const content = item.result.message?.content?.[0]?.text || "";
          if (content) results.set(item.custom_id, content);
        } else {
          console.warn(`[AiPlanService] Sección ${item.custom_id} fallida:`, item.result?.error);
        }
      } catch {
        console.warn("[AiPlanService] Línea JSONL no parseable:", line.substring(0, 80));
      }
    }

    return results;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 1: GENERACIÓN DE CONTENIDO
  // ═══════════════════════════════════════════════════════════════════════════

  static async generateContent(planId: string): Promise<ContentGenerationResult> {
    console.log(`[AiPlanService] ══════════════════════════════════════`);
    console.log(`[AiPlanService] FASE 1: Generando contenido para ${planId}`);
    console.log(`[AiPlanService] ══════════════════════════════════════`);

    const errors: string[] = [];

    try {
      // 1. Obtener datos del plan
      const { data: plan, error: pError } = await supabase
        .from("sanitation_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (pError || !plan) {
        throw new Error("Plan no encontrado");
      }

      const bd = plan.content?.rawAnswers || {};
      const ownerName = bd.ownerName || "Propietario";
      const businessName = plan.businessName || "Sin nombre";
      const estType = plan.establishmentType || "Establecimiento";
      const hasDelivery = bd.hasDelivery === true;

      // 2. Marcar como generando
      await supabase
        .from("sanitation_plans")
        .update({ generation_status: "generating" })
        .eq("id", planId);

      // 3. Recuperar contexto RAG
      const searchQuery = `${estType} ${businessName} ${bd.products || ""}`;
      const knowledge = await this.matchKnowledge(searchQuery);
      const context = knowledge
        .map((k: any) => `[Fuente: ${k.metadata?.source}]\n${k.content}`)
        .join("\n\n---\n\n");

      // ─── System prompts ─────────────────────────────────────────────────────
      const systemPrompt = `Eres un consultor experto en inocuidad alimentaria y normativa sanitaria colombiana.
Redactas en español formal con lenguaje técnico oficial (Secretarías de Salud, IVC).

NORMATIVA APLICABLE:
${context}

Analiza el tipo de establecimiento y aplica:
- Alimentos (fabricación, transformación, preparación, comercialización) → Resolución 2674 de 2013
- Productos cárnicos (carne cruda, canal, vísceras) → Decreto 1500 de 2007
- Ambas actividades → aplica ambas e indícalo

REGLAS DE FORMATO:
- Sé CONCISO: usa tablas Markdown para consolidar información, no prosa extensa.
- Cada programa debe tener máximo 1500 palabras.
- NUNCA generes formatos, planillas ni tablas de seguimiento independientes.
- Usa SIEMPRE: "El registro se realizará a través del Archivo de Verificación Unificado dispuesto para tal fin."

CONOCIMIENTO TÉCNICO:
- L+D: Detergentes alcalinos (grasas), ácidos (minerales). Desinfectantes: Hipoclorito, Amonio cuaternario 5ta gen.
- Plagas: MIP preventivo. Sellado grietas, mallas, trampas luz, estaciones cebo.
- Residuos: Verde (orgánicos), Blanca (aprovechables), Negra (no aprovechables).
- Agua: Cloro residual 0.3-2.0 ppm, pH 6.5-9.0.
- Temperaturas: Congelación <-18°C, Refrigeración 0-4°C, Cocción >70°C centro.
- Personal: Carné manipulador, capacitación anual, indumentaria blanca sin bolsillos/joyas.

FORMATO DE RESPUESTA:
Markdown directo. Sin introducciones, sin backticks, sin bloques de código.
Usa ##, ###, tablas y listas según corresponda.`;

      const metaSystemPrompt = `Eres un consultor experto en inocuidad alimentaria colombiana.
Responde ÚNICAMENTE con JSON válido. Sin markdown, sin backticks. Empieza con { y termina con }.`;

      // ─── Datos comunes ──────────────────────────────────────────────────────
      const negocioInfo = `
- Negocio: ${businessName} | NIT: ${bd.nit || "N/A"}
- Propietario: ${ownerName}
- Tipo: ${estType}
- Dirección: ${bd.address || "N/A"}
- Productos: ${bd.products || "N/A"}
- Equipos: ${bd.equipment || "N/A"}
- Espacios: ${bd.spaces || "N/A"}
- Domicilios: ${hasDelivery ? "Sí" : "No"}
- Alto riesgo: ${bd.hasHighRiskFoods ? "Sí" : "No"} ${bd.highRiskFoodsDetail ? `(${bd.highRiskFoodsDetail})` : ""}`;

      const mdSuffix = "\n\nResponde en Markdown directo. Sin introducciones ni backticks.";

      // ═══════════════════════════════════════════════════════════════════════
      // Construir todas las solicitudes para el Batch
      // ═══════════════════════════════════════════════════════════════════════
      type SectionDef = { id: string; col: string; isJson: boolean; system: string; user: string; maxTokens: number };

      const sections: SectionDef[] = [
        // ── Metadatos (JSON)
        {
          id: "plan_meta", col: "plan_meta", isJson: true,
          system: metaSystemPrompt,
          user: `Genera metadatos del plan para:\n${negocioInfo}\n\nJSON exacto:\n{ "businessName": "${businessName}", "nit": "${bd.nit || "N/A"}", "address": "${bd.address || "N/A"}", "establishmentType": "${estType}", "ownerName": "${ownerName}", "normApplied": "norma aplicable", "elaborationDate": "fecha actual formato largo", "validity": "1 año", "version": "1.0" }`,
          maxTokens: 1024,
        },
        // ── Secciones base (Markdown)
        {
          id: "plan_introduction", col: "plan_introduction", isJson: false,
          system: systemPrompt,
          user: `Genera la Introducción del Plan de Saneamiento para:\n${negocioInfo}\n\nPresentar establecimiento, justificar necesidad del plan, referenciar normativa. Máximo 3 párrafos.${mdSuffix}`,
          maxTokens: 2048,
        },
        {
          id: "plan_objective", col: "plan_objective", isJson: false,
          system: systemPrompt,
          user: `Genera el Objetivo General del Plan para:\n${negocioInfo}\n\nObjetivo claro y medible + 4-5 objetivos específicos como sub-lista.${mdSuffix}`,
          maxTokens: 2048,
        },
        {
          id: "plan_legal_basis", col: "plan_legal_basis", isJson: false,
          system: systemPrompt,
          user: `Genera el Marco Normativo para:\n${negocioInfo}\n\nTabla Markdown con columnas: Norma | Año | Alcance. Incluir todas las aplicables.${mdSuffix}`,
          maxTokens: 2048,
        },
        {
          id: "plan_scope", col: "plan_scope", isJson: false,
          system: systemPrompt,
          user: `Genera el Alcance del Plan para:\n${negocioInfo}\n\nDefinir áreas, procesos, personal y productos que aplica. Máximo 2 párrafos + lista.${mdSuffix}`,
          maxTokens: 2048,
        },
        // ── Programas (Markdown)
        {
          id: "program_cleaning", col: "program_cleaning", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Limpieza y Desinfección para:\n${negocioInfo}\n\nESTRUCTURA (máx 1500 palabras):\n### Objetivo\n1 párrafo breve.\n### Alcance\n1 párrafo: áreas y equipos cubiertos.\n### Definiciones\nLista de máximo 5 términos clave.\n### Procedimientos por Área\nTABLA: Área/Equipo | Procedimiento | Producto | Concentración | Frecuencia | Responsable\n### Verificación\n1 párrafo indicando registro en AVU.${mdSuffix}`,
          maxTokens: 4096,
        },
        {
          id: "program_water", col: "program_water", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Calidad del Agua Potable para:\n${negocioInfo}\n\nESTRUCTURA (máx 1200 palabras):\n### Objetivo\n1 párrafo.\n### Alcance\nFuentes de agua utilizadas.\n### Control de Tanques\nTABLA: Actividad | Frecuencia | Responsable\n### Parámetros de Calidad\nTABLA: Parámetro | Valor Aceptable | Frecuencia Monitoreo\n### Verificación\nReferencia al AVU.${mdSuffix}`,
          maxTokens: 4096,
        },
        {
          id: "program_waste", col: "program_waste", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Manejo de Residuos Sólidos para:\n${negocioInfo}\n\nESTRUCTURA (máx 1200 palabras):\n### Objetivo\n1 párrafo.\n### Clasificación de Residuos\nTABLA: Tipo | Color Recipiente | Ejemplos\n### Manejo Interno\nLista breve: ruta, frecuencia, almacenamiento.\n### Disposición Final\n1 párrafo.\n### Verificación\nReferencia al AVU.${mdSuffix}`,
          maxTokens: 4096,
        },
        {
          id: "program_pests", col: "program_pests", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Control Integral de Plagas para:\n${negocioInfo}\n\nESTRUCTURA (máx 1200 palabras):\n### Objetivo\n1 párrafo.\n### Plagas Potenciales\nLista breve.\n### Medidas Preventivas\nTABLA: Medida | Ubicación | Frecuencia\n### Control Activo\nTABLA: Dispositivo | Cantidad | Ubicación | Frecuencia Revisión\n### Verificación\nReferencia al AVU.${mdSuffix}`,
          maxTokens: 4096,
        },
        {
          id: "program_temperatures", col: "program_temperatures", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Control de Temperaturas para:\n${negocioInfo}\n\nESTRUCTURA (máx 1200 palabras):\n### Objetivo\n1 párrafo.\n### Rangos de Temperatura\nTABLA: Etapa/Equipo | Rango Aceptable | Frecuencia Monitoreo\n### Acciones Correctivas\n1 párrafo.\n### Verificación\nReferencia al AVU.${mdSuffix}`,
          maxTokens: 4096,
        },
        {
          id: "program_raw_materials", col: "program_raw_materials", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Materias Primas e Insumos para:\n${negocioInfo}\n\nESTRUCTURA (máx 1200 palabras):\n### Objetivo\n1 párrafo.\n### Selección de Proveedores\nCriterios breves.\n### Recepción e Inspección\nTABLA: Aspecto | Criterio Aceptación | Criterio Rechazo\n### Almacenamiento\nLista: PEPS, separación, altura.\n### Verificación\nReferencia al AVU.${mdSuffix}`,
          maxTokens: 4096,
        },
        // ── Cierre (Markdown)
        {
          id: "plan_records", col: "plan_records", isJson: false,
          system: systemPrompt,
          user: `Genera la sección de Registros y Verificación para:\n${negocioInfo}\n\nEstructura (máximo 250 palabras):\n### Archivo de Verificación Unificado (AVU)\n1 párrafo: qué es y qué documenta.\n### Uso del AVU\n1 párrafo: frecuencia, responsable, archivo.${mdSuffix}`,
          maxTokens: 1536,
        },
        {
          id: "plan_conclusions", col: "plan_conclusions", isJson: false,
          system: systemPrompt,
          user: `Genera las Conclusiones del Plan para:\n${negocioInfo}\n\nMáximo 200 palabras. Resumir compromisos e importancia del cumplimiento.${mdSuffix}`,
          maxTokens: 1536,
        },
      ];

      if (hasDelivery) {
        sections.push({
          id: "program_delivery", col: "program_delivery", isJson: false,
          system: systemPrompt,
          user: `Genera el Programa de Domicilios y Transporte para:\n${negocioInfo}\n\nESTRUCTURA (máx 1000 palabras):\n### Objetivo\n1 párrafo.\n### Empaque\nLista: materiales, sellado.\n### Control de Temperatura\nTABLA: Tipo Alimento | Temperatura | Tiempo Máximo\n### Protocolo del Domiciliario\nLista de verificación breve.\n### Verificación\nReferencia al AVU.${mdSuffix}`,
          maxTokens: 4096,
        });
      }

      // ═══════════════════════════════════════════════════════════════════════
      // Enviar Batch y esperar resultado
      // ═══════════════════════════════════════════════════════════════════════
      console.log(`[AiPlanService] Enviando batch con ${sections.length} secciones...`);

      const batchId = await this.submitBatch(
        sections.map((s) => ({
          custom_id: s.id,
          params: {
            model: "claude-sonnet-4-6",
            max_tokens: s.maxTokens,
            system: s.system,
            messages: [{ role: "user", content: s.user }],
          },
        }))
      );

      await this.pollBatchUntilDone(batchId);
      const results = await this.getBatchResults(batchId);

      console.log(`[AiPlanService] Batch completado. ${results.size}/${sections.length} secciones recibidas.`);

      // ═══════════════════════════════════════════════════════════════════════
      // Guardar cada sección en Supabase
      // ═══════════════════════════════════════════════════════════════════════
      let sectionsCompleted = 0;

      for (const section of sections) {
        const rawText = results.get(section.id);

        if (!rawText) {
          errors.push(section.col);
          await supabase
            .from("sanitation_plans")
            .update({ [section.col]: `[ERROR] Sin respuesta del batch` })
            .eq("id", planId);
          continue;
        }

        try {
          let valueToSave: any;

          if (section.isJson) {
            const cleaned = rawText
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/\s*```$/i, "")
              .trim();
            valueToSave = JSON.parse(cleaned);
          } else {
            valueToSave = rawText.trim();
          }

          const { error: dbError } = await supabase
            .from("sanitation_plans")
            .update({ [section.col]: valueToSave })
            .eq("id", planId);

          if (dbError) throw dbError;

          console.log(`[AiPlanService] ✅ ${section.col} guardado (${rawText.length} chars)`);
          sectionsCompleted++;
        } catch (saveErr: any) {
          console.error(`[AiPlanService] ❌ ${section.col} error al guardar:`, saveErr.message || saveErr);
          errors.push(section.col);
          await supabase
            .from("sanitation_plans")
            .update({ [section.col]: section.isJson ? { error: true, message: String(saveErr.message) } : `[ERROR] ${saveErr.message}` })
            .eq("id", planId);
        }
      }

      // ═══════════════════════════════════════════════════════════════════════
      // Determinar resultado
      // ═══════════════════════════════════════════════════════════════════════
      const sectionsTotal = sections.length;
      const hasErrors = sectionsCompleted < sectionsTotal;
      const newStatus = hasErrors ? "partial_error" : "content_ready";

      await supabase
        .from("sanitation_plans")
        .update({ generation_status: newStatus })
        .eq("id", planId);

      console.log(`[AiPlanService] ══════════════════════════════════════`);
      console.log(`[AiPlanService] Contenido: ${sectionsCompleted}/${sectionsTotal} secciones OK`);
      console.log(`[AiPlanService] Estado: ${newStatus}`);
      console.log(`[AiPlanService] ══════════════════════════════════════`);

      return { success: !hasErrors, sectionsCompleted, sectionsTotal, errors };

    } catch (error: any) {
      console.error("[AiPlanService] Error fatal:", error);
      await supabase
        .from("sanitation_plans")
        .update({ generation_status: "error" })
        .eq("id", planId);

      return {
        success: false,
        sectionsCompleted: 0,
        sectionsTotal: 0,
        errors: [error.message || "Error desconocido"],
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FASE 2: GENERACIÓN DE PDF
  // ═══════════════════════════════════════════════════════════════════════════

  static async generatePdf(planId: string): Promise<PdfGenerationResult> {
    console.log(`[AiPlanService] ══════════════════════════════════════`);
    console.log(`[AiPlanService] FASE 2: Generando PDF para ${planId}`);
    console.log(`[AiPlanService] ══════════════════════════════════════`);

    try {
      // 1. Verificar que el contenido esté listo
      const { data: plan, error: pError } = await supabase
        .from("sanitation_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (pError || !plan) {
        throw new Error("Plan no encontrado");
      }

      if (plan.generation_status !== "content_ready" && plan.generation_status !== "partial_error") {
        throw new Error(`Estado inválido: ${plan.generation_status}. Debe ser 'content_ready' o 'partial_error'.`);
      }

      // 2. Marcar como generando PDF
      await supabase
        .from("sanitation_plans")
        .update({ generation_status: "generating_pdf" })
        .eq("id", planId);

      // 3. Asegurar que existe un certificateCode y generar QR
      let planCode = plan.certificateCode;
      if (!planCode || planCode.startsWith('SAN-')) { // Overwrite original timestamp-based code with our structured one
        planCode = generateSanitationCode();
        await supabase
          .from("sanitation_plans")
          .update({ certificateCode: planCode })
          .eq("id", planId);
        plan.certificateCode = planCode; // Update local object
      }

      // 4. Generar QR Code (Base64 data URL)
      // Note: Use the public verification URL
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://manipuladorcapacitado.com';
      const verifyUrl = `${appUrl}/verify/${planCode}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 2,
        width: 300,
        color: {
          dark: '#1a365d',
          light: '#ffffff'
        }
      });

      // 5. Cargar firma de Angélica (si existe)
      let signatureDataUrl = "";
      try {
        const sigPath = path.join(process.cwd(), "public/sanitation_plans/firma_angelica_plan_saneamiento.png");
        if (fs.existsSync(sigPath)) {
          const sigBase64 = fs.readFileSync(sigPath).toString("base64");
          signatureDataUrl = `data:image/png;base64,${sigBase64}`;
        }
      } catch (err) {
        console.warn("[AiPlanService] No se pudo cargar la firma de Angélica:", err);
      }

      // 5b. Cargar logo de la empresa (si existe)
      let logoDataUrl = "";
      try {
        const logoUrl = plan.content?.rawAnswers?.logoUrl;
        if (logoUrl) {
          if (logoUrl.startsWith("data:")) {
            // Ya es un data URL base64, usarlo directamente
            logoDataUrl = logoUrl;
            console.log("[AiPlanService] Logo comercial cargado desde data URL.");
          } else {
            // Es una URL remota, hacer fetch
            console.log("[AiPlanService] Cargando logo comercial desde URL:", logoUrl);
            const response = await fetch(logoUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const contentType = response.headers.get("content-type") || "image/png";
              const base64 = Buffer.from(buffer).toString("base64");
              logoDataUrl = `data:${contentType};base64,${base64}`;
            }
          }
        }
      } catch (err) {
        console.warn("[AiPlanService] No se pudo cargar el logo comercial:", err);
      }

      // 6. Generar HTML del plan
      const html = this.renderPlanToHtml(plan, qrCodeDataUrl, signatureDataUrl);

      // 4. Generar PDF con Puppeteer
      const pdfBuffer = await this.generatePdfWithPuppeteer(html, plan, logoDataUrl, qrCodeDataUrl);

      // 5. Subir a Supabase Storage
      const fileName = `plan-${planId}-${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sanitation-plans") // Asegúrate de crear este bucket en Supabase
        .upload(fileName, pdfBuffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Error subiendo PDF: ${uploadError.message}`);
      }

      // 6. Obtener URL pública
      const { data: urlData } = supabase.storage
        .from("sanitation-plans")
        .getPublicUrl(fileName);

      const pdfUrl = urlData.publicUrl;

      // 7. Guardar URL y marcar como completado
      const updatedContent = { 
        ...(plan.content || {}), 
        pdfUrl: pdfUrl 
      };

      await supabase
        .from("sanitation_plans")
        .update({
          status: "COMPLETED",
          generation_status: "completed",
          content: updatedContent
        })
        .eq("id", planId);

      console.log(`[AiPlanService] ✅ PDF generado: ${pdfUrl}`);

      return {
        success: true,
        pdfUrl,
        error: null,
      };

    } catch (error: any) {
      console.error("[AiPlanService] Error generando PDF:", error);

      // Revertir a content_ready para permitir reintentos
      await supabase
        .from("sanitation_plans")
        .update({ generation_status: "content_ready" })
        .eq("id", planId);

      return {
        success: false,
        pdfUrl: null,
        error: error.message || "Error desconocido",
      };
    }
  }

  // ─── Renderizar plan a HTML ─────────────────────────────────────────────────

  // ─── Renderizar plan a HTML ─────────────────────────────────────────────────
  
  private static renderPlanToHtml(plan: any, qrCodeDataUrl?: string, signatureDataUrl?: string): string {
    const meta = plan.plan_meta || {};
    const marked = require("marked"); // npm install marked

    // Función helper para convertir Markdown a HTML
    const md = (content: string | null | undefined): string => {
      if (!content || content.startsWith("[ERROR]")) return "";
      // Ensure marked is available
      const markedInstance = typeof marked !== 'undefined' ? marked : require("marked");
      return markedInstance.parse(content);
    };

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plan de Saneamiento - ${meta.businessName || plan.businessName}</title>
  <style>
    @page {
      size: letter;
      margin: 2cm 2.5cm;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 13pt;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      text-align: justify;
    }
    
    /* Portada */
    .cover-page {
      page-break-after: always;
      text-align: center;
      padding-top: 15vh;
    }
    
    .cover-page h1 {
      font-size: 28pt;
      color: #1a365d;
      margin-bottom: 0.5em;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    
    .cover-page .business-name {
      font-size: 22pt;
      color: #2c5282;
      margin: 1em 0;
      font-weight: 600;
    }
    
    .cover-page .meta-info {
      margin-top: 4em;
      font-size: 12pt;
      color: #4a5568;
    }
    
    .cover-page .meta-info p {
      margin: 0.3em 0;
    }
    
    /* Encabezados */
    h1 {
      font-size: 18pt;
      color: #1a365d;
      border-bottom: 2px solid #2c5282;
      padding-bottom: 0.3em;
      margin-top: 1.5em;
      page-break-after: avoid;
    }
    
    h2 {
      font-size: 14pt;
      color: #2c5282;
      margin-top: 1.2em;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: 12pt;
      color: #2d3748;
      margin-top: 1em;
      page-break-after: avoid;
    }
    
    /* Tablas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 12pt;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #cbd5e0;
      padding: 8px 10px;
      text-align: justify;
    }
    
    th {
      background-color: #2c5282;
      color: white;
      font-weight: 600;
    }
    
    tr:nth-child(even) {
      background-color: #f7fafc;
    }
    
    /* Listas */
    ul, ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }
    
    li {
      margin: 0.3em 0;
    }
    
    /* Secciones */
    .section {
      page-break-inside: avoid;
      margin-bottom: 1.5em;
    }
    
    /* Salto de página antes de cada programa */
    .program {
      page-break-before: always;
    }
    
    .program:first-of-type {
      page-break-before: auto;
    }

    /* Sección de Firmas */
    .signatures-section {
      page-break-before: always;
      margin-top: 40px;
    }

    .signatures-section h1 {
      text-align: center;
      border-bottom: none;
      margin-bottom: 60px;
    }

    .signature-grid {
      display: table;
      width: 100%;
      margin-bottom: 50px;
      border-collapse: separate;
      border-spacing: 40px 0;
    }

    .signature-col {
      display: table-cell;
      width: 50%;
      vertical-align: top;
      text-align: center;
    }

    .signature-line {
      width: 220px;
      border-bottom: 2px solid #000;
      margin: 0 auto 10px auto;
    }

    .signature-name {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 2px;
    }

    .signature-role {
      font-weight: bold;
      font-size: 10pt;
      margin-bottom: 4px;
    }

    .signature-desc {
      font-style: italic;
      font-size: 9pt;
      color: #555;
    }

    .signature-space {
      height: 80px;
      position: relative;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 2px;
    }

    .signature-img {
      max-width: 180px;
      max-height: 90px;
      position: absolute;
      bottom: -10px;
      z-index: 1;
    }

    /* Notas Legales */
    .legal-notes {
      margin-top: 60px;
    }

    .legal-note {
      background-color: #f5f5f5;
      border-left: 4px solid #1a365d;
      padding: 12px 15px;
      margin-bottom: 15px;
      font-size: 10pt;
      color: #444;
      line-height: 1.5;
    }

    .legal-note strong {
      color: #1a365d;
    }

    /* ── Formato de Seguimiento Unificado — páginas landscape ────────── */
    @page landscape-format {
      size: letter landscape;
    }

    .landscape-wrapper {
      page: landscape-format;
      page-break-before: always;
    }

    .landscape-content {
      background: white;
    }

    .format-title {
      font-size: 10pt;
      font-weight: 900;
      text-align: center;
      color: #1a365d;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 2px solid #2c5282;
      padding-bottom: 4px;
    }

    .format-meta {
      font-size: 8pt;
      text-align: center;
      color: #4a5568;
      margin-bottom: 8px;
    }

    .format-table {
      width: 100%;
    }

    .format-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7pt;
      table-layout: fixed;
    }

    .format-table th,
    .format-table td {
      border: 1px solid #475569;
      padding: 2px 2px;
      text-align: center;
      vertical-align: middle;
      line-height: 1.2;
      word-break: break-word;
    }

    .format-table .group-header {
      background-color: #1a365d;
      color: white;
      font-size: 7.5pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .format-table .col-header {
      background-color: #dbeafe;
      color: #1e3a8a;
      font-weight: bold;
      font-size: 6.5pt;
    }

    .format-table .day-col {
      background-color: #f1f5f9;
      font-weight: bold;
      width: 24px;
      min-width: 24px;
      color: #1a365d;
    }

    .format-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    .format-table tr:nth-child(odd) td {
      background-color: #ffffff;
    }

    .format-table .day-col {
      background-color: #e2e8f0 !important;
    }

    .format-footer {
      margin-top: 8px;
      font-size: 7.5pt;
      color: #4a5568;
      border-top: 1px solid #cbd5e0;
      padding-top: 5px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .format-sign-line {
      display: inline-block;
      width: 160px;
      border-bottom: 1px solid #1a365d;
      margin-top: 18px;
      margin-right: 4px;
    }
  </style>
</head>
<body>
  <!-- PORTADA -->
  <div class="cover-page">
    <h1>Plan de Saneamiento Básico</h1>
    <div class="business-name">${meta.businessName || plan.businessName || "Establecimiento"}</div>
    <p style="font-size: 14pt; color: #4a5568;">${meta.establishmentType || plan.establishmentType || ""}</p>
    
    <div class="meta-info">
      <p><strong>NIT:</strong> ${meta.nit || "N/A"}</p>
      <p><strong>Dirección:</strong> ${meta.address || "N/A"}</p>
      <p><strong>Propietario:</strong> ${meta.ownerName || "N/A"}</p>
      <p><strong>Normativa aplicada:</strong> ${meta.normApplied || "Resolución 2674 de 2013"}</p>
      <p><strong>Fecha de elaboración:</strong> ${meta.elaborationDate || new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p><strong>Vigencia:</strong> ${meta.validity || "1 año"}</p>
      <p><strong>Versión:</strong> ${meta.version || "1.0"}</p>
    </div>
  </div>

  <!-- INTRODUCCIÓN -->
  <div class="section">
    <h1>1. Introducción</h1>
    ${md(plan.plan_introduction)}
  </div>

  <!-- OBJETIVO -->
  <div class="section">
    <h1>2. Objetivo</h1>
    ${md(plan.plan_objective)}
  </div>

  <!-- MARCO NORMATIVO -->
  <div class="section">
    <h1>3. Marco Normativo</h1>
    ${md(plan.plan_legal_basis)}
  </div>

  <!-- ALCANCE -->
  <div class="section">
    <h1>4. Alcance</h1>
    ${md(plan.plan_scope)}
  </div>

  <!-- PROGRAMAS -->
  <div class="program">
    <h1>5. Programa de Limpieza y Desinfección</h1>
    ${md(plan.program_cleaning)}
  </div>

  <div class="program">
    <h1>6. Programa de Calidad del Agua Potable</h1>
    ${md(plan.program_water)}
  </div>

  <div class="program">
    <h1>7. Programa de Manejo de Residuos Sólidos</h1>
    ${md(plan.program_waste)}
  </div>

  <div class="program">
    <h1>8. Programa de Control Integral de Plagas</h1>
    ${md(plan.program_pests)}
  </div>

  <div class="program">
    <h1>9. Programa de Control de Temperaturas</h1>
    ${md(plan.program_temperatures)}
  </div>

  <div class="program">
    <h1>10. Programa de Materias Primas e Insumos</h1>
    ${md(plan.program_raw_materials)}
  </div>

  ${plan.program_delivery ? `
  <div class="program">
    <h1>11. Programa de Domicilios y Transporte</h1>
    ${md(plan.program_delivery)}
  </div>
  ` : ""}

  <!-- REGISTROS -->
  <div class="section">
    <h1>${plan.program_delivery ? "12" : "11"}. Registros y Verificación</h1>
    ${md(plan.plan_records)}
  </div>

  <!-- CONCLUSIONES -->
  <div class="section">
    <h1>${plan.program_delivery ? "13" : "12"}. Conclusiones</h1>
    ${md(plan.plan_conclusions)}
  </div>

  <!-- SECCIÓN DE FIRMAS Y RESPONSABILIDADES -->
  <div class="signatures-section">
    <h1>FIRMAS Y RESPONSABILIDADES</h1>

    <div class="signature-grid">
      <!-- Profesional -->
      <div class="signature-col">
        <div class="signature-space">
          ${signatureDataUrl ? `<img src="${signatureDataUrl}" class="signature-img" />` : ''}
        </div>
        <div class="signature-line"></div>
        <div class="signature-name">Angelica M. López</div>
        <div class="signature-role">Nutricionista - Dietista</div>
        <div class="signature-desc">Elaboró el Plan de Saneamiento</div>
      </div>

      <!-- Representante Legal -->
      <div class="signature-col">
        <div class="signature-space"></div>
        <div class="signature-line"></div>
        <div class="signature-name">${meta.ownerName || "Representante Legal"}</div>
        <div class="signature-role">Representante Legal</div>
        <div class="signature-name">${meta.businessName || plan.businessName || "Establecimiento"}</div>
        ${meta.nit ? `<div class="signature-role">NIT: ${meta.nit}</div>` : ""}
        <div class="signature-desc">Recibió y aprobó el Plan de Saneamiento</div>
      </div>
    </div>

    <div class="legal-notes">
      <div class="legal-note">
        <strong>NOTA 1 — Responsabilidad:</strong><br>
        La ejecución y mantenimiento del presente Plan de Saneamiento es responsabilidad exclusiva del Representante Legal del establecimiento ${meta.businessName || plan.businessName || "el establecimiento"}.
      </div>
      <div class="legal-note">
        <strong>NOTA 2 — Integridad del documento:</strong><br>
        Cualquier alteración, modificación o reproducción parcial del presente documento sin autorización escrita del profesional que lo elaboró invalida su contenido y puede acarrear consecuencias legales conforme a la normativa vigente.
      </div>
    </div>

    </div>

  </div>

  ${this.renderUnifiedFollowUpFormat(plan)}

</body>
</html>
    `.trim();
  }

  // ─── Renderizar Formato de Seguimiento Unificado ────────────────────────────

  private static renderUnifiedFollowUpFormat(plan: any): string {
    const meta = plan.plan_meta || {};
    const businessName = meta.businessName || plan.businessName || "Establecimiento";
    const address = meta.address || "N/A";
    const nit = meta.nit || "N/A";
    const ownerName = meta.ownerName || "Representante Legal";

    // Filas de días (31 días)
    let dayRows1 = "";
    let dayRows2 = "";
    for (let i = 1; i <= 31; i++) {
      const bg = i % 2 === 0 ? "" : "";
      dayRows1 += `<tr>
        <td class="day-col">${i}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`;
      dayRows2 += `<tr>
        <td class="day-col">${i}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td>
        <td></td><td></td><td></td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
      </tr>`;
    }

    return `
    <!-- ══ FORMATO UNIFICADO — HOJA 1 ══ -->
    <div class="landscape-wrapper">
      <div class="landscape-content">

        <div class="format-title">Formato de Seguimiento Unificado — Control Sanitario Mensual</div>
        <div class="format-meta">
          <strong>Establecimiento:</strong> ${businessName} &nbsp;|&nbsp;
          <strong>NIT:</strong> ${nit} &nbsp;|&nbsp;
          <strong>Dirección:</strong> ${address} &nbsp;|&nbsp;
          <strong>Mes/Año:</strong> ________________________
        </div>

        <div class="format-table">
          <table>
            <colgroup>
              <col style="width:24px">
              <!-- Limpieza y Desinfección: 9 cols -->
              <col><col><col><col><col><col><col><col><col>
              <!-- Control de Plagas: 8 cols -->
              <col><col><col><col><col><col><col><col>
              <!-- Materias Primas: 9 cols -->
              <col><col><col><col><col><col><col><col><col>
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2" class="day-col">Día</th>
                <th colspan="9" class="group-header">Limpieza y Desinfección — Marque ✓</th>
                <th colspan="8" class="group-header">Control Integral de Plagas — Marque ✓</th>
                <th colspan="9" class="group-header">Materias Primas e Insumos — Marque ✓</th>
              </tr>
              <tr>
                <th class="col-header">Limp. general</th>
                <th class="col-header">Desinf. superf.</th>
                <th class="col-header">Utensilios</th>
                <th class="col-header">Equipos</th>
                <th class="col-header">Neveras</th>
                <th class="col-header">Paredes</th>
                <th class="col-header">Pisos</th>
                <th class="col-header">Luminarias</th>
                <th class="col-header">Observación</th>

                <th class="col-header">Verificación</th>
                <th class="col-header">Avistamiento</th>
                <th class="col-header">Almacén.</th>
                <th class="col-header">Preparación</th>
                <th class="col-header">Clientes</th>
                <th class="col-header">Recepción</th>
                <th class="col-header">UTA</th>
                <th class="col-header">Observación</th>

                <th class="col-header">Cumple</th>
                <th class="col-header">No Cumple</th>
                <th class="col-header">PEPS</th>
                <th class="col-header">Fechas vto.</th>
                <th class="col-header">Envases</th>
                <th class="col-header">Separación</th>
                <th class="col-header">Temp. recep.</th>
                <th class="col-header">Proveedor</th>
                <th class="col-header">Observación</th>
              </tr>
            </thead>
            <tbody>
              ${dayRows1}
            </tbody>
          </table>
        </div>

        <div class="format-footer">
          <div>
            <strong>Instrucción:</strong> Use ✓ para cumplimiento, ✗ para incumplimiento. Registre observaciones en el AVU cuando sea necesario.
          </div>
          <div style="text-align:right; font-size:7pt; color:#64748b;">
            Res. 2674/2013 · Hoja 1 de 2
          </div>
        </div>

      </div>
    </div>

    <!-- ══ FORMATO UNIFICADO — HOJA 2 ══ -->
    <div class="landscape-wrapper">
      <div class="landscape-content">

        <div class="format-title">Formato de Seguimiento Unificado — Control Sanitario Mensual (Continuación)</div>
        <div class="format-meta">
          <strong>Establecimiento:</strong> ${businessName} &nbsp;|&nbsp;
          <strong>NIT:</strong> ${nit} &nbsp;|&nbsp;
          <strong>Dirección:</strong> ${address} &nbsp;|&nbsp;
          <strong>Mes/Año:</strong> ________________________
        </div>

        <div class="format-table">
          <table>
            <colgroup>
              <col style="width:24px">
              <!-- Agua: 6 cols -->
              <col><col><col><col><col><col>
              <!-- Residuos: 3 cols -->
              <col><col><col>
              <!-- Temperaturas: 10 cols -->
              <col><col><col><col><col><col><col><col><col><col>
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2" class="day-col">Día</th>
                <th colspan="6" class="group-header">Calidad del Agua Potable — Diligencie valores</th>
                <th colspan="3" class="group-header">Residuos Sólidos — Cantidad (Kg)</th>
                <th colspan="10" class="group-header">Verificación de Temperaturas — Diligencie en °C</th>
              </tr>
              <tr>
                <th class="col-header">Cloro (mg/L)</th>
                <th class="col-header">pH</th>
                <th class="col-header">Color</th>
                <th class="col-header">Olor</th>
                <th class="col-header">Sabor</th>
                <th class="col-header">Turbiedad</th>

                <th class="col-header">Aprovecha­bles</th>
                <th class="col-header">No aprovech.</th>
                <th class="col-header">Orgánicos</th>

                <th class="col-header">Refrig. 1</th>
                <th class="col-header">Refrig. 2</th>
                <th class="col-header">Congel. 1</th>
                <th class="col-header">Congel. 2</th>
                <th class="col-header">Cuarto frío 1</th>
                <th class="col-header">Cuarto frío 2</th>
                <th class="col-header">Mostrador 1</th>
                <th class="col-header">Mostrador 2</th>
                <th class="col-header">_____________</th>
                <th class="col-header">_____________</th>
              </tr>
            </thead>
            <tbody>
              ${dayRows2}
            </tbody>
          </table>
        </div>

        <div class="format-footer">
          <div style="flex:1">
            <strong>NOTA:</strong> El diligenciamiento de este formato es obligatorio para demostrar el cumplimiento del Plan de Saneamiento
            ante la autoridad sanitaria (Resolución 2674 de 2013, Art. 26).
          </div>
          <div style="flex:1; text-align:center; padding: 0 20px;">
            <div class="format-sign-line"></div>
            <div style="font-size:7pt; font-weight:bold; color:#1a365d;">${ownerName}</div>
            <div style="font-size:6.5pt; color:#64748b;">Representante Legal / Responsable</div>
          </div>
          <div style="flex:1; text-align:right;">
            <div class="format-sign-line"></div>
            <div style="font-size:7pt; font-weight:bold; color:#1a365d;">Inspector / Auditor</div>
            <div style="font-size:6.5pt; color:#64748b;">Firma y fecha de verificación</div>
          </div>
        </div>

      </div>
    </div>
    `;
  }

  // ─── Generar PDF con Puppeteer ──────────────────────────────────────────────
  
  private static async generatePdfWithPuppeteer(html: string, plan: any, logoDataUrl?: string, qrCodeDataUrl?: string): Promise<Buffer> {
    console.log("[AiPlanService] Iniciando Puppeteer para generación simple...");
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--disable-crash-reporter",
        "--disable-extensions",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      // Renderizado con Encabezado y Pie de página
      const meta = plan.plan_meta || {};
      const businessName = meta.businessName || plan.businessName || "Establecimiento";
      const nit = meta.nit || "N/A";
      const address = meta.address || "N/A";

      const pdfBuffer = await page.pdf({
        format: "letter",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 8pt; color: #1a365d; width: 100%; display: flex; justify-content: space-between; align-items: top; padding: 0 40px; margin-top: 10px; padding-bottom: 5px;">
            <div style="width: 60px; height: 60px; display: flex; align-items: center; justify-content: flex-start;">
              ${logoDataUrl ? `<img src="${logoDataUrl}" style="width: 38px; height: 38px; object-fit: contain; border-radius: 2px;" />` : ''}
            </div>
            <div style="flex: 1; text-align: center; line-height: 1.3;">
              <div style="font-weight: bold; text-transform: uppercase;">Plan de Saneamiento</div>
              <div style="font-weight: 600; color: #2c5282;">${businessName}</div>
              <div style="color: #4a5568; font-size: 7pt;">${address}</div>
            </div>
            <div style="width: 100px; text-align: right; font-weight: 600;">
              NIT: ${nit}
            </div>
          </div>
        `,
        footerTemplate: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 8pt; color: #4a5568; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 0 40px; margin-bottom: 10px;">
            <div style="flex: 1;"></div>
            <div style="flex: 1; text-align: center;">
              Página: <span class="pageNumber"></span> de <span class="totalPages"></span>
            </div>
            <div style="flex: 1; text-align: right; display: flex; align-items: center; justify-content: flex-end;">
              <div style="margin-right: 8px; text-align: right;">
                <div style="font-weight: bold; font-size: 6pt; color: #a0aec0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1;">Verificación</div>
                <div style="font-family: monospace; font-size: 6pt; color: #718096; line-height: 1;">${plan.certificateCode || ""}</div>
              </div>
              ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" style="width: 40px; height: 40px;" />` : ''}
            </div>
          </div>
        `,
        margin: { top: '65mm', bottom: '30mm', left: '20mm', right: '20mm' }
      });

      return Buffer.from(pdfBuffer);

    } catch (err) {
      console.error("[AiPlanService] Fallo en Puppeteer:", err);
      throw err;
    } finally {
      await browser.close();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ORQUESTADOR COMPLETO
  // ═══════════════════════════════════════════════════════════════════════════

  static async generateFullPlan(planId: string): Promise<FullPlanResult> {
    // Fase 1: Generar contenido
    const contentResult = await this.generateContent(planId);

    if (!contentResult.success) {
      return {
        success: false,
        contentResult,
        pdfResult: null,
      };
    }

    // Fase 2: Generar PDF
    const pdfResult = await this.generatePdf(planId);

    return {
      success: pdfResult.success,
      contentResult,
      pdfResult,
    };
  }

  static async verifyPlan(code: string) {
    const { data: plan, error } = await supabase
      .from('sanitation_plans')
      .select('*')
      .eq('certificateCode', code)
      .maybeSingle();

    console.log("[AiPlanService.verifyPlan] DB Query for code:", code, "Error:", error, "Found:", !!plan);

    if (error || !plan) return null;

    const meta = plan.plan_meta || plan.businessData || {};
    const pdfUrl = plan.content?.pdfUrl || null;

    return {
      type: 'SANITATION_PLAN' as const,
      businessName: meta.businessName || plan.businessName || 'Establecimiento',
      representativeName: meta.ownerName || meta.legal_representative || 'Representante Legal',
      nit: meta.nit || 'N/A',
      createdAt: plan.createdAt,
      planCode: plan.certificateCode || code,
      pdfUrl: pdfUrl,
      status: plan.generation_status === 'completed' ? 'VALID' : 'PROCESSING'
    };
  }
}

