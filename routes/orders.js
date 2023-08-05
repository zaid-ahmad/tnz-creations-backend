const express = require('express')
const router = express.Router()

const orders_controller = require('../controllers/orders_controller')

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next()
  else res.redirect('/')
}

router.get('/', ensureAuthenticated, orders_controller.orders_get)

module.exports = router
