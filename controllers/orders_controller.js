const Order = require('../models/order')

const asyncHandler = require('express-async-handler')

exports.orders_get = asyncHandler(async (req, res) => {
  const allOrders = await Order.find({ status: 'paid' })
    .populate('products.product')
    .sort({ date_placed: -1 })
    .exec()

  res.render('orders', {
    orders: allOrders,
  })
})
