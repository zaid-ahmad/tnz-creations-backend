const express = require('express')
const Razorpay = require('razorpay')
const crypto = require('crypto')

const router = express.Router()

const Order = require('../models/order')

router.post('/orders', async (req, res) => {
  try {
    const { productId } = req.body

    const orderData = await Order.findOne({ _id: productId })
    const amount = orderData.totalAmount * 0.18 + orderData.totalAmount

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      amount: amount * 100,
      currency: 'INR',
    }

    instance.orders.create(options, (error, order) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: 'Something went wrong x_x' })
      }
      res.status(200).json({ data: order })
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Internal server error!' })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body

    const { orderId } = req.query

    const order = await Order.findOne({ _id: orderId })

    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex')

    if (razorpay_signature === expectedSign) {
      order.status = 'paid'
      order.razorpay_order_id = razorpay_order_id
      order.razorpay_payment_id = razorpay_payment_id
      order.razorpay_signature = razorpay_signature

      await order.save()

      res.redirect(
        `http://localhost:5173/paymentsuccess?reference=${razorpay_payment_id}`
      )
    } else {
      return res.status(400).json({ message: 'Invalid signature sent!' })
    }
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Internal server error!' })
  }
})

router.get('/apiInfo', (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_KEY_ID })
)

module.exports = router
