import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async (to, subject, text) => {
  const { data, error } = await resend.emails.send({
    from: "SCMS <onboarding@resend.dev>",
    to,
    subject,
    text
  })

  if (error) {
    console.error("Email delivery failed:", error.message)
    throw new Error(error.message)
  }

  console.log("Email accepted by Resend:", data.id)
}

export default sendEmail
