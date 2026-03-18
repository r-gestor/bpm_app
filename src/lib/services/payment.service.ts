import crypto from "crypto";

export class PaymentService {
  static generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
    integritySecret: string
  ): string {
    const stringToSign = `${reference}${amountInCents}${currency}${integritySecret}`;
    return crypto.createHash("sha256").update(stringToSign).digest("hex");
  }

  static validateWebhookSignature(
    payload: any,
    xWompiSignature: string,
    eventsSecret: string
  ): boolean {
    const { data, timestamp } = payload;
    const transaction = data.transaction;
    
    // La firma se genera concatenando id + status + amount_in_cents + timestamp + secret
    const stringToSign = `${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${eventsSecret}`;
    const hash = crypto.createHash("sha256").update(stringToSign).digest("hex");
    
    return hash === xWompiSignature;
  }

  static async processWompiWebhook(payload: any) {
    const { data, event } = payload;
    
    if (event !== "transaction.updated") return;

    const transaction = data.transaction;
    const orderId = transaction.reference;
    const status = transaction.status; // APPROVED, DECLINED, VOIDED, ERROR

    // Actualizar orden y triggers (matrícula, etc)
    const { OrderService } = require("./order.service");
    await OrderService.updateOrderStatus(orderId, status, transaction.id);
    
    return { orderId, status };
  }
}
