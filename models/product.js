const mongoose = require('mongoose')

const Schema = mongoose.Schema

const ProductSchema = new Schema({
  name: { type: String, required: true },
  images: [{ type: String, required: true }],
  price: { type: Number, required: true },
  discount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  description: { type: String, required: true },
  colors: [{ type: String, required: false }],
  stock: { type: String, required: true },
  weight: { type: Number, required: false },
  dimensions: [{ type: String, required: false }],
})

ProductSchema.virtual('url').get(function () {
  return `/category/products/${this._id}`
})

module.exports = mongoose.model('Product', ProductSchema)
