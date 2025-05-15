"use server";
import transporter from "@/lib/mail";

export async function sendEmailServerAction({
  to,
  subject,
  meta,
}: {
  to: string;
  subject: string;
  meta: {
    title?: string;
    description: string;
    link: string;
    buttonText?: string;
    footer?: string;
  };
}) {
  const mailOptions = {
    from: process.env.MAILTRAP_FROM as string,
    to,
    subject: `Asphere Apps - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body, html {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
          }
          .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
          }
          .email-header {
            background-color: #4a6cf7;
            padding: 24px;
            text-align: center;
          }
          .logo {
            max-height: 40px;
          }
          .header-title {
            color: white;
            font-size: 24px;
            margin: 10px 0;
          }
          .email-content {
            padding: 30px;
            line-height: 1.6;
          }
          .email-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 16px;
            color: #333;
          }
          .email-text {
            font-size: 16px;
            margin-bottom: 24px;
            color: #555;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .verification-button {
            display: inline-block;
            background-color: #4a6cf7;
            color: white;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 4px;
            transition: background-color 0.2s;
          }
          .verification-button:hover {
            background-color: #3a5bd9;
          }
          .email-footer {
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #999;
            border-top: 1px solid #eee;
          }
          .help-text {
            margin-top: 16px;
            font-size: 14px;
            color: #888;
          }
          .link-text {
            word-break: break-all;
            color: #4a6cf7;
            font-size: 14px;
            margin-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1 class="header-title">Asphere Apps</h1>
          </div>
          <div class="email-content">
            <h2 class="email-title">${meta.title || subject}</h2>
            <p class="email-text">${meta.description}</p>
            <div class="button-container">
              <a href="${meta.link}" class="verification-button">${meta.buttonText || "Click Here"}</a>
            </div>
            <p class="help-text">If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link-text">${meta.link}</p>
          </div>
          <div class="email-footer">
            <p>${meta.footer || ""}</p>
            <p>&copy; ${new Date().getFullYear()} Asphere Apps. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("sendMailAction", error);
    return { success: false };
  }
}
