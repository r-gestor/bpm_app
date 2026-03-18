import { marked } from "marked";

/**
 * Interfaz para plan_meta (jsonb column).
 */
export interface PlanMeta {
  businessName: string;
  nit: string;
  address: string;
  establishmentType: string;
  ownerName: string;
  normApplied: string;
  elaborationDate: string;
  validity: string;
  version: string;
}

/**
 * Datos del plan leídos directamente de las columnas de sanitation_plans.
 * Las secciones narrativas son strings Markdown (columnas text).
 * plan_meta es un objeto JSON (columna jsonb).
 */
export interface SanitationPlanData {
  plan_meta: PlanMeta;
  plan_introduction: string;
  plan_objective: string;
  plan_legal_basis: string;
  plan_scope: string;
  program_cleaning: string;
  program_water: string;
  program_pests: string;
  program_waste: string;
  program_temperatures: string;
  program_raw_materials: string;
  program_delivery?: string;
  plan_records: string;
  plan_conclusions: string;
}

/**
 * Convierte Markdown a HTML usando marked.
 */
function md(markdown: string | null | undefined): string {
  if (!markdown) return "";
  return marked.parse(markdown, { async: false }) as string;
}

/**
 * Convierte las columnas del plan de saneamiento a HTML completo para Puppeteer.
 */
export function planJsonToHtml(
  plan: SanitationPlanData,
  options: { logoBase64?: string; qrBase64?: string } = {}
): string {
  const { logoBase64 } = options;
  const m = plan.plan_meta;

  const programSections = [
    { key: "program_cleaning" as const, label: "Programa de Limpieza y Desinfección" },
    { key: "program_water" as const, label: "Programa de Calidad del Agua Potable" },
    { key: "program_pests" as const, label: "Programa de Control Integral de Plagas" },
    { key: "program_waste" as const, label: "Programa de Manejo de Residuos Sólidos" },
    { key: "program_temperatures" as const, label: "Programa de Control de Temperaturas" },
    { key: "program_raw_materials" as const, label: "Programa de Manejo de Materias Primas" },
    { key: "program_delivery" as const, label: "Programa de Servicio a Domicilio" },
  ];

  const programsHtml = programSections
    .filter((p) => {
      const val = plan[p.key];
      return val && !val.startsWith("[ERROR]");
    })
    .map(
      (p) => `
      <div class="program-section">
        ${md(plan[p.key])}
      </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      line-height: 1.7;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 22px; color: #1a3a5c; text-align: center; margin-top: 100px; }
    h2 { font-size: 14px; color: #1a3a5c; border-bottom: 2px solid #1a3a5c; margin-top: 28px; padding-bottom: 4px; }
    h3 { font-size: 12px; color: #2c5f8a; margin-top: 18px; }
    h4 { font-size: 11px; color: #3a7ab5; margin-top: 14px; }
    p { text-align: justify; margin-bottom: 8px; }
    ul, ol { margin-left: 20px; margin-bottom: 10px; }
    li { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin: 12px 0; }
    th { background: #1a3a5c; color: white; padding: 6px 8px; text-align: left; font-weight: bold; }
    td { border: 1px solid #ccc; padding: 5px 8px; }
    tr:nth-child(even) td { background: #f9f9f9; }
    blockquote { background: #f0f4f8; border-left: 4px solid #1a3a5c; padding: 10px 15px; font-style: italic; margin: 12px 0; color: #333; }
    .cover-page { height: 90vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
    .cover-page h1 { margin-top: 0; }
    .program-section { page-break-before: always; }
    .program-section:first-child { page-break-before: auto; }
    .signature-section { page-break-before: always; }
    .signature-grid { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-col { width: 45%; text-align: center; }
    .sig-line { border-top: 1px solid #000; margin: 0 auto 8px; width: 200px; }
    .avu-page { page-break-before: always; }
    .avu-header { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .avu-header td { border: 1px solid #000; padding: 10px; }
    .avu-table { width: 100%; border-collapse: collapse; }
    .avu-table th { background: #1a1a1a; color: #fff; padding: 8px; font-size: 9px; border: 1px solid #333; }
    .avu-table td { border: 1px solid #000; height: 30px; }
  </style>
</head>
<body>

  <!-- PORTADA -->
  <div class="cover-page">
    ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 150px; margin-bottom: 40px;">` : ""}
    <h1>${m.normApplied}</h1>
    <h2 style="border: none; page-break-before: auto; text-align: center;">${m.businessName}</h2>
    <p style="margin-top: 80px;">
      <strong>PROPIETARIO:</strong> ${m.ownerName}<br>
      <strong>NIT:</strong> ${m.nit}<br>
      <strong>DIRECCIÓN:</strong> ${m.address}<br>
      <strong>TIPO:</strong> ${m.establishmentType}
    </p>
    <p style="margin-top: 120px;">
      ${m.elaborationDate}<br>
      <span style="font-size: 9px; color: #666;">Versión ${m.version} — Vigencia: ${m.validity}</span>
    </p>
  </div>

  <!-- INTRODUCCIÓN -->
  <div style="page-break-before: always;">
    ${md(plan.plan_introduction)}
  </div>

  <!-- OBJETIVO -->
  ${md(plan.plan_objective)}

  <!-- MARCO LEGAL -->
  <div style="page-break-before: always;">
    ${md(plan.plan_legal_basis)}
  </div>

  <!-- ALCANCE -->
  ${md(plan.plan_scope)}

  <!-- PROGRAMAS -->
  ${programsHtml}

  <!-- REGISTROS -->
  <div style="page-break-before: always;">
    <h2>Registros y Verificación</h2>
    ${md(plan.plan_records)}
  </div>

  <!-- CONCLUSIONES -->
  ${md(plan.plan_conclusions)}

  <!-- FIRMAS -->
  <div class="signature-section">
    <h2 style="text-align: center; border: none;">FIRMAS Y APROBACIÓN DEL PLAN DE SANEAMIENTO</h2>
    <div class="signature-grid">
      <div class="sig-col">
        <div style="height: 80px;"></div>
        <div class="sig-line"></div>
        <strong>Profesional Elaborador</strong><br>
        <span style="font-size: 9px; color: #666;">Profesional elaborador del plan</span>
      </div>
      <div class="sig-col">
        <div style="height: 80px;"></div>
        <div class="sig-line"></div>
        <strong>Representante Legal</strong><br>
        NIT: ${m.nit}
      </div>
    </div>
    <div style="text-align: center; margin-top: 60px;">
      <p>${m.elaborationDate}</p>
      <p style="font-size: 9px; color: #666;">
        Este documento fue elaborado conforme a la normativa sanitaria colombiana vigente
        y tiene validez de un (1) año a partir de la fecha de elaboración.
      </p>
    </div>
  </div>

  <!-- HOJA AVU -->
  <div class="avu-page">
    <table class="avu-header">
      <tr>
        <td width="20%" align="center">
          ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 50px;">` : "Logo"}
        </td>
        <td width="60%" align="center">
          <strong style="font-size: 14px;">ARCHIVO DE VERIFICACIÓN UNIFICADO</strong><br>
          <span style="font-size: 12px;">${m.businessName}</span>
        </td>
        <td width="20%" style="font-size: 8px;">
          Código: AVU-SGC-001<br>
          Versión: 001<br>
          Fecha: ${m.elaborationDate}
        </td>
      </tr>
    </table>
    <table class="avu-table">
      <thead>
        <tr>
          <th>Fecha</th><th>Programa</th><th>Actividad realizada</th>
          <th>Responsable</th><th>Observaciones</th><th>Firma</th><th>Próxima verificar.</th>
        </tr>
      </thead>
      <tbody>
        ${Array(15).fill(0).map(() => "<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>").join("")}
      </tbody>
    </table>
    <div style="text-align: center; font-size: 8px; margin-top: 10px; color: #666;">
      Documento controlado — ${m.businessName} — Diligenciar con esfero de tinta negra o azul
    </div>
  </div>

</body>
</html>`;
}
