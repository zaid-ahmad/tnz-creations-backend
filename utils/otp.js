const crypto = require('crypto')
const nodemailer = require('nodemailer')
const otpTemplate = require('../email/otp')

const generateOTP = () => {
  return crypto.randomBytes(3).toString('hex')
}

const sendOTP = (email, OTP) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVICE_USER,
      pass: process.env.EMAIL_SERVICE_PASS,
    },
  })

  const mailOptions = {
    from: {
      name: 'TNZ Creations',
      address: process.env.EMAIL_SERVICE_USER,
    },
    to: email,
    subject: 'Email Verification - TNZ Creations',
    html: otpTemplate(OTP),
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

module.exports = { generateOTP, sendOTP }
