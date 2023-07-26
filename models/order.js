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
    },
  ],
  totalAmount: {
    type: Number,
  },
  shippingAddress: {
    type: String,
  },
  status: {
    type: String,
    default: 'new',
  },
})

module.exports = mongoose.model('Order', orderSchema)
