import transporter from "@/lib/mail";
import { NextRequest } from "next/server";

// Helper functions
function getTypeLabel(
  type: "bug" | "feature" | "feedback" | "support" | string
) {
  const labels: Record<string, string> = {
    bug: "Bug Report",
    feature: "Feature Request",
    feedback: "General Feedback",
    support: "Technical Support",
  };
  return labels[type] || "Unknown";
}

function getTypeBadge(
  type: "bug" | "feature" | "feedback" | "support" | string
) {
  const badges: Record<string, string> = {
    bug: "🐛 Bug Report",
    feature: "✨ Feature Request",
    feedback: "💬 General Feedback",
    support: "🆘 Technical Support",
  };
  return badges[type as string] || "❓ Unknown";
}

function getTypeColor(
  type: "bug" | "feature" | "feedback" | "support" | string
) {
  const colors: Record<string, string> = {
    bug: "bug",
    feature: "feature",
    feedback: "feedback",
    support: "support",
  };
  return colors[type] || "feedback";
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, type, subject, message } = await request.json();

    // Validasi input
    if (!name || !email || !type || !subject || !message) {
      return Response.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Validasi email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Format email tidak valid" },
        { status: 400 }
      );
    }

    // Template email untuk developer
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .badge { 
            display: inline-block; 
            padding: 6px 16px; 
            border-radius: 20px; 
            font-size: 14px; 
            font-weight: bold; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .bug { background: #fee2e2; color: #dc2626; }
          .feature { background: #ddd6fe; color: #7c3aed; }
          .feedback { background: #dcfce7; color: #16a34a; }
          .support { background: #fef3c7; color: #d97706; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { margin-top: 8px; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #3b82f6; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .message-content { white-space: pre-wrap; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📧 New Feedback Received</h1>
            <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Document Tracking Application</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Tipe Laporan</div>
              <div class="value">
                <span class="badge ${getTypeColor(type)}">${getTypeBadge(type)}</span>
              </div>
            </div>
            
            <div class="field">
              <div class="label">Pengirim</div>
              <div class="value">
                <strong>${name}</strong><br>
                <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none;">${email}</a>
              </div>
            </div>
            
            <div class="field">
              <div class="label">Subject</div>
              <div class="value"><strong>${subject}</strong></div>
            </div>
            
            <div class="field">
              <div class="label">Pesan Detail</div>
              <div class="value">
                <div class="message-content">${message}</div>
              </div>
            </div>
            
            <div class="field">
              <div class="label">Waktu Diterima</div>
              <div class="value">
                📅 ${new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}<br>
                🕐 ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
              </div>
            </div>
            
            <div class="footer">
              <p><strong>💡 Tips:</strong> Anda dapat membalas email ini untuk merespons langsung ke pengirim</p>
              <p style="font-size: 12px; margin-top: 15px;">Email ini digenerate otomatis oleh Document Tracking System</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Kirim email ke developer
    const mailOptions = {
      from: `"Document Tracking App" <${process.env.NEXT_APP_NAME}>`,
      to: "kamal.akbarzy@gmail.com",
      subject: `[${getTypeLabel(type)}] ${subject}`,
      html: htmlTemplate,
      replyTo: email, // Memungkinkan developer untuk reply langsung ke user
    };

    await transporter.sendMail(mailOptions);

    // Kirim email konfirmasi ke user
    const confirmationHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f0fdf4; padding: 30px; border-radius: 0 0 8px 8px; }
          .highlight { background: #dcfce7; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin: 20px 0; }
          .info-box { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #d1fae5; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">✅ Feedback Berhasil Dikirim!</h1>
            <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 16px;">Terima kasih atas partisipasi Anda</p>
          </div>
          <div class="content">
            <p style="font-size: 18px;">Halo <strong>${name}</strong>,</p>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>🎉 Feedback Anda telah berhasil diterima!</strong></p>
              <p style="margin: 10px 0 0 0;">Tim developer kami akan segera meninjau pesan Anda.</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #059669;">📋 Ringkasan Feedback Anda:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Tipe:</strong> ${getTypeLabel(type)}</li>
                <li><strong>Subject:</strong> ${subject}</li>
                <li><strong>Dikirim pada:</strong> ${new Date().toLocaleString(
                  "id-ID",
                  {
                    timeZone: "Asia/Jakarta",
                    dateStyle: "full",
                    timeStyle: "short",
                  }
                )}</li>
              </ul>
            </div>
            
            <div class="highlight">
              <p style="margin: 0;"><strong>⏰ Waktu Respon:</strong></p>
              <p style="margin: 10px 0 0 0;">Tim kami akan merespons dalam <strong>1-2 hari kerja</strong>. Untuk pertanyaan mendesak, hubungi langsung developer di email di bawah.</p>
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #059669;">📞 Kontak Langsung:</h3>
              <p style="margin: 0;">Developer: <strong>kamal.akbarzy@gmail.com</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Untuk pertanyaan teknis atau diskusi mendalam tentang aplikasi</p>
            </div>
            
            <p>Kontribusi Anda sangat berarti bagi pengembangan aplikasi Document Tracking. Setiap feedback membantu kami memberikan pengalaman yang lebih baik!</p>
            
            <div class="footer">
              <p><strong>Salam hangat,</strong></p>
              <p><strong>Document Tracking Development Team</strong></p>
              <hr style="border: none; border-top: 1px solid #d1fae5; margin: 20px 0;">
              <p style="font-size: 12px;">Email ini dikirim otomatis. Mohon jangan membalas email ini.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const confirmationMailOptions = {
      from: `"Document Tracking Team" <${process.env.NEXT_APP_NAME}>`,
      to: email,
      subject: `✅ Feedback Anda Berhasil Diterima - ${subject}`,
      html: confirmationHtml,
    };

    await transporter.sendMail(confirmationMailOptions);

    return Response.json({
      success: true,
      message:
        "Feedback berhasil dikirim dan email konfirmasi telah dikirim ke alamat Anda.",
    });
  } catch (error) {
    console.error("Error sending feedback email:", error);
    return Response.json(
      {
        error:
          "Terjadi kesalahan saat mengirim feedback. Silakan coba lagi atau hubungi developer langsung.",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Method tidak diizinkan selain POST
export async function GET() {
  return Response.json({ error: "Method tidak diizinkan" }, { status: 405 });
}
