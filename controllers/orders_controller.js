const Order = require('../models/order')

const asyncHandler = require('express-async-handler')

exports.orders_get = asyncHandler(async (req, res) => {
  const allOrders = await Order.find({ status: { $ne: 'new' } })
    .populate('products.product')
    .sort({ date_placed: -1 })
    .exec()

  res.render('orders', {
    orders: allOrders,
    filterValue: '',
  })
})

exports.change_order_status = asyncHandler(async (req, res) => {
  const { orderId } = req.params
  const { orderStatus } = req.body

  await Order.findByIdAndUpdate(orderId, { status: orderStatus })

  res.redirect('/orders')
})

exports.filter_by_order_status = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body

  if (orderStatus === 'all') {
    const allOrders = await Order.find({ status: { $ne: 'new' } })
      .populate('products.product')
      .sort({ date_placed: -1 })
      .exec()

    res.render('orders', {
      orders: allOrders,
      filterValue: '',
    })
  } else {
    const filteredOrders = await Order.find({ status: orderStatus })
      .populate('products.product')
      .sort({ date_placed: -1 })
      .exec()

    res.render('orders', {
      orders: filteredOrders,
      filterValue: orderStatus,
    })
  }
})
