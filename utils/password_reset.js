const nodemailer = require('nodemailer')
const passwordResetTemplate = require('../email/password-reset')

const sendResetMail = (email) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVICE_USER,
      pass: process.env.EMAIL_SERVICE_PASS,
    },
  })

  let link = 'https://www.google.com'

  const mailOptions = {
    from: {
      name: 'TNZ Creations',
      address: process.env.EMAIL_SERVICE_USER,
    },
    to: email,
    subject: 'Reset Your Password - TNZ Creations',
    html: passwordResetTemplate(link),
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

module.exports = { sendResetMail }
