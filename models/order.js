const mongoose = require('mongoose')
const Schema = mongoose.Schema

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      color: { type: String, required: true },
    },
  ],
  totalAmount: {
    type: Number,
  },
  shippingAddress: {
    name: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pin: { type: String },
    phone: { type: String },
  },
  status: {
    type: String,
    default: 'new',
  },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  date_placed: { type: String },
})

module.exports = mongoose.model('Order', orderSchema)
