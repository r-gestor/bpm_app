import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { planJsonToHtml, SanitationPlanData } from '@/lib/utils/plan-to-html';

// Re-export the interface
export type PdfData = SanitationPlanData;

export class PdfService {
  private static async generateQRBase64(text: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(text);
      return qrDataUrl;
    } catch (err) {
      console.error('Error generating QR:', err);
      return '';
    }
  }

  private static async getBase64FromUrl(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const mimeType = response.headers.get('content-type') || 'image/png';
      return `data:${mimeType};base64,${buffer.toString('base64')}`;
    } catch (err) {
      console.error('Error converting image to base64:', err);
      return '';
    }
  }

  static async generateSanitationPlanPdf(data: PdfData, logoUrl?: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    const page = await browser.newPage();

    const logoBase64 = logoUrl ? await this.getBase64FromUrl(logoUrl) : '';
    const qrBase64 = await this.generateQRBase64(
      `https://manipuladorcapacitado.com/verify/plan/${data.plan_meta.nit}`
    );

    const htmlContent = planJsonToHtml(data, { logoBase64, qrBase64 });
    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-family: Arial; font-size: 8px; width: 100%; padding: 10px 40px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div style="width: 80px; height: 30px; display: flex; align-items: center;">
            ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 25px;">` : ''}
          </div>
          <div style="text-align: center;">
            <strong style="font-size: 10px;">PLAN DE SANEAMIENTO</strong><br>
            ${data.plan_meta.businessName}
          </div>
          <div style="text-align: right; color: #666;">
            Fecha: ${data.plan_meta.elaborationDate}<br>
            Código: PS-SGC-001 | Versión: 001<br>
            Página <span class="pageNumber"></span> de <span class="totalPages"></span>
          </div>
        </div>
      `,
      footerTemplate: `
        <div style="font-family: Arial; font-size: 8px; width: 100%; padding: 10px 40px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div style="color: #999;">
            ${data.plan_meta.businessName}<br>
            ${data.plan_meta.address}
          </div>
          <div style="text-align: right;">
            ${qrBase64 ? `<img src="${qrBase64}" style="max-height: 40px;">` : ''}
          </div>
        </div>
      `,
      margin: { top: '100px', bottom: '80px', left: '40px', right: '40px' }
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
