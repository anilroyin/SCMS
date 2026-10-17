import { google } from "googleapis"

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET
)

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
})

const sendEmail = async (to, subject, text) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    text
  ].join("\r\n")

  const encodedMessage = Buffer.from(message)
    .toString("base64url")

  const { data } = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage
    }
  })

  console.log("Email sent through Gmail:", data.id)
}

export default sendEmail