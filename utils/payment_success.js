const nodemailer = require('nodemailer')
const paymentSuccessfulTemplate = require('../email/payment-successful')
const newOrderTemplate = require('../email/newOrder')

const sendPaymentSuccessMail = (email) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_SERVICE_USER,
      pass: process.env.EMAIL_SERVICE_PASS,
    },
  })

  let link = 'http://localhost:5173/account/orders'
  let adminLink = 'http://localhost:3000/orders'

  const mailOptions = {
    from: {
      name: 'TNZ Creations',
      address: process.env.EMAIL_SERVICE_USER,
    },
    to: email,
    subject: 'Payment Successful - TNZ Creations',
    html: paymentSuccessfulTemplate(link),
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

const sendOrderEmailToAdmin = () => {
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
    to: ['tausifahmadn3@gmail.com', 'tnzcreations1@gmail.com'],
    subject: 'You have a new order 😀 - TNZ Creations',
    html: newOrderTemplate(adminLink),
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      console.log('Email sent: ' + info.response)
    }
  })
}

module.exports = { sendPaymentSuccessMail, sendOrderEmailToAdmin }
