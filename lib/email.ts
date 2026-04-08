import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'Reservas Costa Brava <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'luisglez.pruebas@gmail.com';

// Helper function to format dates
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Helper function to format date range
function formatDateRange(checkIn: Date, checkOut: Date): string {
  return `${formatDate(checkIn)} - ${formatDate(checkOut)}`;
}

/**
 * Send email notification to admin when a new reservation request is created
 */
export async function sendNewRequestEmail(reservation: {
  id: string;
  user: { name: string; email: string };
  checkIn: Date;
  checkOut: Date;
  guests: number;
  notes?: string | null;
  createdAt: Date;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `Nueva solicitud de reserva - ${reservation.user.name}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
              .label { font-weight: bold; color: #1f2937; }
              .value { color: #4b5563; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">🏖️ Nueva Solicitud de Reserva</h2>
              </div>
              <div class="content">
                <p>Se ha recibido una nueva solicitud de reserva:</p>
                
                <div class="info-row">
                  <span class="label">Usuario:</span>
                  <span class="value">${reservation.user.name}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Fechas:</span>
                  <span class="value">${formatDateRange(reservation.checkIn, reservation.checkOut)}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Número de personas:</span>
                  <span class="value">${reservation.guests} ${reservation.guests === 1 ? 'persona' : 'personas'}</span>
                </div>
                
                ${reservation.notes ? `
                <div class="info-row">
                  <span class="label">Notas:</span>
                  <div class="value" style="margin-top: 5px;">${reservation.notes}</div>
                </div>
                ` : ''}
                
                <div class="info-row">
                  <span class="label">Fecha de solicitud:</span>
                  <span class="value">${formatDate(reservation.createdAt)}</span>
                </div>
                
                <div class="footer">
                  <p>Por favor, revisa y gestiona esta solicitud desde el panel de administración.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending new request email:', error);
      return { success: false, error };
    }

    console.log('✅ New request email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending new request email:', error);
    return { success: false, error };
  }
}

/**
 * Send email notification to user when their reservation is approved
 */
export async function sendApprovedEmail(reservation: {
  id: string;
  user: { name: string; email: string };
  checkIn: Date;
  checkOut: Date;
  guests: number;
  notes?: string | null;
  adminComment?: string | null;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: reservation.user.email,
      subject: '✅ Tu reserva ha sido aprobada',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
              .label { font-weight: bold; color: #1f2937; }
              .value { color: #4b5563; }
              .success-message { background-color: #d1fae5; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #10b981; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">✅ Reserva Aprobada</h2>
              </div>
              <div class="content">
                <div class="success-message">
                  <strong>¡Buenas noticias, ${reservation.user.name}!</strong><br>
                  Tu solicitud de reserva ha sido aprobada.
                </div>
                
                <h3 style="color: #1f2937;">Detalles de tu reserva:</h3>
                
                <div class="info-row">
                  <span class="label">Fechas:</span>
                  <span class="value">${formatDateRange(reservation.checkIn, reservation.checkOut)}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Número de personas:</span>
                  <span class="value">${reservation.guests} ${reservation.guests === 1 ? 'persona' : 'personas'}</span>
                </div>
                
                ${reservation.notes ? `
                <div class="info-row">
                  <span class="label">Tus notas:</span>
                  <div class="value" style="margin-top: 5px;">${reservation.notes}</div>
                </div>
                ` : ''}
                
                ${reservation.adminComment ? `
                <div class="info-row">
                  <span class="label">Mensaje del administrador:</span>
                  <div class="value" style="margin-top: 5px;">${reservation.adminComment}</div>
                </div>
                ` : ''}
                
                <div class="footer">
                  <p>¡Esperamos que disfrutes de tu estancia en la Costa Brava! 🏖️</p>
                  <p style="margin-top: 10px;">Si necesitas hacer algún cambio, por favor contacta con el administrador.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending approved email:', error);
      return { success: false, error };
    }

    console.log('✅ Approved email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending approved email:', error);
    return { success: false, error };
  }
}

/**
 * Send email notification to user when their reservation is rejected
 */
export async function sendRejectedEmail(reservation: {
  id: string;
  user: { name: string; email: string };
  checkIn: Date;
  checkOut: Date;
  guests: number;
  notes?: string | null;
  adminComment?: string | null;
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: reservation.user.email,
      subject: 'Actualización sobre tu solicitud de reserva',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #ef4444; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
              .info-row { margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; }
              .label { font-weight: bold; color: #1f2937; }
              .value { color: #4b5563; }
              .warning-message { background-color: #fee2e2; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ef4444; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">Actualización de Reserva</h2>
              </div>
              <div class="content">
                <div class="warning-message">
                  <strong>Hola ${reservation.user.name},</strong><br>
                  Lamentablemente, tu solicitud de reserva no ha podido ser aprobada en este momento.
                </div>
                
                <h3 style="color: #1f2937;">Detalles de la solicitud:</h3>
                
                <div class="info-row">
                  <span class="label">Fechas solicitadas:</span>
                  <span class="value">${formatDateRange(reservation.checkIn, reservation.checkOut)}</span>
                </div>
                
                <div class="info-row">
                  <span class="label">Número de personas:</span>
                  <span class="value">${reservation.guests} ${reservation.guests === 1 ? 'persona' : 'personas'}</span>
                </div>
                
                ${reservation.notes ? `
                <div class="info-row">
                  <span class="label">Tus notas:</span>
                  <div class="value" style="margin-top: 5px;">${reservation.notes}</div>
                </div>
                ` : ''}
                
                ${reservation.adminComment ? `
                <div class="info-row" style="background-color: #fef3c7; border-left: 4px solid #f59e0b;">
                  <span class="label">Motivo:</span>
                  <div class="value" style="margin-top: 5px;">${reservation.adminComment}</div>
                </div>
                ` : ''}
                
                <div class="footer">
                  <p>Puedes intentar solicitar otras fechas o contactar con el administrador para más información.</p>
                  <p style="margin-top: 10px;">Gracias por tu comprensión.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending rejected email:', error);
      return { success: false, error };
    }

    console.log('✅ Rejected email sent successfully:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending rejected email:', error);
    return { success: false, error };
  }
}

// Made with Bob
