import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "smtp",
  host: process.env.MAILTRAP_HOST as string,
  port: parseInt(process.env.MAILTRAP_PORT as string),
  secure: process.env.NODE_ENV === "production",
  auth: {
    user: process.env.MAILTRAP_USERNAME as string,
    pass: process.env.MAILTRAP_PASSWORD as string,
  },
});

export default transporter;
