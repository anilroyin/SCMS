import nodemailer from "nodemailer"

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  })

  console.log("Attempting SMTP connection...")

  await transporter.verify()

  console.log("SMTP connection verified")

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  })

  console.log("Password reset email sent successfully")
}

export default sendEmail
