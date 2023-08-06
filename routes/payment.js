const express = require('express')
const Razorpay = require('razorpay')
const crypto = require('crypto')

const router = express.Router()

const Order = require('../models/order')
const User = require('../models/user')

router.post('/orders', async (req, res) => {
  try {
    const { productId, shippingCharges } = req.body

    const orderData = await Order.findOne({ _id: productId })
    const orderAmount = Number(
      Math.ceil(orderData.totalAmount * 0.18) +
        orderData.totalAmount +
        shippingCharges
    )

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })

    const options = {
      amount: orderAmount * 100,
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

    const { orderId, addressId, email, shippingCharges } = req.query

    const user = await User.findOne({ email })
    const order = await Order.findOne({ _id: orderId })
    const address = user.address.find(
      (addr) => addr._id.toString() === addressId
    )

    const shippingAddress = {
      name: address.name,
      address: address.address,
      city: address.city,
      state: address.state,
      pin: address.pin,
      phone: address.phone,
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex')

    if (razorpay_signature === expectedSign) {
      order.status = 'paid'
      order.totalAmount = Number(
        Math.ceil(order.totalAmount * 0.18) +
          order.totalAmount +
          shippingCharges
      )
      order.date_placed = new Date()
      order.shippingAddress = shippingAddress
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
