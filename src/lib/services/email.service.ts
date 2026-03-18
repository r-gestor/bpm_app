/**
 * Service for sending transactional emails using Brevo (Sendinblue)
 */
export const EmailService = {
  /**
   * Sends a transactional email using Brevo's API
   */
  async sendEmail(data: {
    to: { email: string; name?: string }[];
    subject: string;
    htmlContent: string;
  }) {
    const apiKey = process.env.BREVO_API_KEY;
    const sender = {
      name: "BPM Salud",
      email: process.env.EMAIL_FROM || "info@manipuladorcapacitado.com"
    };

    if (!apiKey) {
      console.warn("BREVO_API_KEY not found. Email not sent.");
      return;
    }

    try {
      console.log(`Enviando email a: ${data.to.map(t => t.email).join(", ")} via Brevo V3...`);
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "api-key": apiKey
        },
        body: JSON.stringify({
          sender,
          to: data.to,
          subject: data.subject,
          htmlContent: data.htmlContent
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Error de Brevo:", result);
        throw new Error(result.message || "Failed to send email via Brevo");
      }

      console.log("Email enviado exitosamente:", result.messageId);
      return result;
    } catch (error) {
      console.error("Error sending email via Brevo:", error);
      throw error;
    }
  },

  /**
   * Specifically sends the student activation email
   */
  async sendActivationEmail(to: string, name: string, activationLink: string) {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
        <div style="text-align: center; padding-bottom: 20px;">
          <h1 style="color: #3b82f6; margin-bottom: 5px;">BPM Salud</h1>
          <p style="font-size: 14px; color: #64748b; margin-top: 0;">Excelencia en Capacitación de Salud</p>
        </div>
        
        <div style="background-color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0;">
          <h2 style="margin-top: 0; font-size: 24px; color: #0f172a;">¡Hola, ${name}!</h2>
          <p style="font-size: 16px; line-height: 1.6;">Bienvenido a <strong>BPM Salud</strong>. Tu empleador o supervisor te ha registrado como estudiante en nuestra plataforma.</p>
          
          <p style="font-size: 16px; line-height: 1.6;">Para empezar a acceder a tus cursos y capacitaciones, primero debes activar tu cuenta y definir una contraseña segura.</p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${activationLink}" 
               style="background-color: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
               Activar mi Cuenta
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Si el botón no funciona, puedes copiar y pegar este enlace en tu navegador:</p>
          <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${activationLink}</p>
        </div>
        
        <div style="text-align: center; padding-top: 32px; font-size: 12px; color: #94a3b8;">
          <p>&copy; ${new Date().getFullYear()} BPM Salud. Todos los derechos reservados.</p>
          <p>Este es un correo transaccional generado automáticamente.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: [{ email: to, name }],
      subject: "¡Bienvenido a BPM Salud! Activa tu cuenta de estudiante",
      htmlContent
    });
  }
};
