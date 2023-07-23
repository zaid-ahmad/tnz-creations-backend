const crypto = require('crypto')
const nodemailer = require('nodemailer')

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
    from: process.env.EMAIL_SERVICE_USER,
    to: email,
    subject: 'Confirm Your Email Address for TNZ Creations',
    text: `
    Welcome to TNZ Creations! We're thrilled to have you as a member of our vibrant online community. To kickstart your journey, we kindly ask you to verify your email address.

Please copy and paste the OTP below to confirm your email address:
OTP: ${OTP}

By verifying your email, you'll unlock the full potential of our website and immerse yourself in a seamless shopping experience. Explore our latest collection of garden-related products, save your favorite items, and be the first to know about exclusive offers and promotions.

If you didn't register for an account with TNZ Creations, kindly ignore this email. Your privacy and security are our utmost priorities.

Should you have any questions or require further assistance, our dedicated support team is here to help. Feel free to reach out to us at tnzcreations1@gmail.com, and we'll be more than happy to assist you.

Once again, thank you for choosing TNZ Creations. We're eager to serve you and provide a delightful shopping experience.

Warm regards,
The TNZ Creations Team
    `,
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
