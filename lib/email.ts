import { Resend } from 'resend'

const fromEmail = process.env.RESEND_FROM_EMAIL || 'Ask Cuter <noreply@askcuter.xyz>'

export async function sendResponseNotification(
  to: string,
  recipientName: string,
  senderName: string,
  response: boolean
) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: `💕 ${recipientName} responded to your valentine!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; text-align: center;">
          <h1 style="font-size: 24px; color: #333; margin-bottom: 8px;">💕 Ask Cuter 💕</h1>
          <p style="font-size: 16px; color: #666; margin-bottom: 24px;">Hey ${senderName},</p>
          <p style="font-size: 20px; color: #333; margin-bottom: 32px;">
            ${recipientName} said <strong style="color: ${response ? '#22c55e' : '#ef4444'};">${response ? 'Yes! 🎉' : 'No 😢'}</strong>
          </p>
          <a href="https://askcuter.xyz" style="display: inline-block; padding: 12px 24px; background-color: #ec4899; color: #fff; text-decoration: none; border-radius: 24px; font-size: 14px;">
            Visit Ask Cuter
          </a>
          <p style="font-size: 12px; color: #999; margin-top: 32px;">You received this because you created a valentine on Ask Cuter.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send response notification email:', error)
  }
}
