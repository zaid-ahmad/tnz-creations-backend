const express = require('express')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const router = express.Router()

const Category = require('../models/category')
const User = require('../models/user')
const Wishlist = require('../models/wishlist')
const Order = require('../models/order')
const Product = require('../models/product')
const { generateOTP, sendOTP } = require('../utils/otp')

require('dotenv').config()

const jwtSecret = process.env.SECRET_KEY

router.get(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params

    try {
      const product = await Product.findOne({ _id: id })
        .populate('category')
        .exec()
      if (product) {
        res.send(product)
      } else {
        res.sendStatus(404)
      }
    } catch (err) {
      res.send(404)
    }
  })
)

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const allCat = await Category.find()

    if (allCat) {
      res.send(allCat)
    } else {
      res.send(404).json('No categories in the database.')
    }
  })
)

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const { name, categories } = req.query

    switch (true) {
      case !!name:
        const product_with_name = await Product.find({ name })
        res.send(product_with_name)
        break

      case !!categories:
        const cats = categories.split(',')
        const categoryObjects = await Category.find({
          name: { $in: cats },
        })
        const categoryIds = categoryObjects.map((category) => category._id)

        const products_in_categories = await Product.find({
          category: { $in: categoryIds },
        })

        res.send(products_in_categories)
        break

      default:
        const products = await Product.find()

        if (products.length > 0) {
          res.send(products)
        } else {
          res.send('no products found')
        }
    }
  })
)

router.get(
  '/filter',
  asyncHandler(async (req, res) => {
    const { filterOption } = req.query

    switch (filterOption) {
      case 'latest':
        const latestProducts = await Product.find().sort({ _id: -1 })
        res.send(latestProducts)
        break
      case 'high':
        const expensiveProducts = await Product.find().sort({ price: -1 })
        res.send(expensiveProducts)
        break
      default:
        const cheapProducts = await Product.find().sort({ price: 1 })
        res.send(cheapProducts)
    }
  })
)

/*
    ---------------BASIC WORKFLOW---------------
  User registers -> email verification page -> email verify -> done
  /register => get email from req.params => verify otp => send jwt token
  /register ---> /generate-otp ---> /verify-otp (if correct send jwt token)

  NO. of pages for this-
  1. Register Page
  2. Generate Token explaining email verification page with send opt button
  3. Form to enter otp 
*/

router.get(
  '/user',
  asyncHandler(async (req, res) => {
    const token = req.cookies.token
    if (token) {
      try {
        const decodedToken = jwt.verify(token, jwtSecret)
        const email = decodedToken.email

        const user = await User.findOne({ email })
        const data_to_send = {
          name: user.name,
          email: user.email,
          phone: user.phone,
          orderHistory: user.orderHistory,
          address: user.address,
        }

        if (user) {
          res.json(data_to_send)
        } else {
          res.sendStatus(498)
        }
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          res.status(498).json('Token expired')
        } else {
          res.sendStatus(403)
        }
      }
    } else {
      res.sendStatus(401) // No token provided
    }
  })
)

router.post('/verify-otp', async (req, res) => {
  const { email, OTP } = req.body

  try {
    const user = await User.findOne({ email: email })

    console.log(user)

    if (!user) {
      return res.sendStatus(403)
    }

    // Check if user account is blocked
    if (user.isBlocked) {
      const currentTime = new Date()
      if (currentTime < user.blockUntil) {
        return res.status(403).send('Account blocked. Try after some time.')
      } else {
        user.isBlocked = false
        user.OTPAttempts = 0
      }
    }

    // Check OTP
    if (user.OTP !== OTP) {
      user.OTPAttempts++

      // If OTP attempts >= 5, block user for 1 hour
      if (user.OTPAttempts >= 5) {
        user.isBlocked = true
        let blockUntil = new Date()
        blockUntil.setHours(blockUntil.getHours() + 1)
        user.blockUntil = blockUntil
      }

      await user.save()

      return res.status(403).send('Invalid OTP')
    }

    // Check if OTP is within 5 minutes
    const OTPCreatedTime = user.OTPCreatedTime
    const currentTime = new Date()

    if (currentTime - OTPCreatedTime > 5 * 60 * 1000) {
      return res.status(401).send('OTP expired')
    }

    // Generate JWT
    const token = jwt.sign({ email: user.email }, jwtSecret, {
      expiresIn: '1d',
    })

    // Clear OTP
    user.OTP = undefined
    user.OTPCreatedTime = undefined
    user.OTPAttempts = 0

    await user.save()
    res.cookie('token', token, { httpOnly: true })
    res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.status(500).send('Server error')
  }
})

// api/generate-otp/:email
router.post(
  '/generate-otp/:email',
  asyncHandler(async (req, res) => {
    const { email } = req.params

    try {
      let user = await User.findOne({ email: email })

      // If user does not exist, send 403 forbidden
      if (!user) {
        res.sendStatus(403)
      }

      if (user.isBlocked) {
        const currentTime = new Date()
        if (currentTime < user.blockUntil) {
          return res.status(403).send('Account blocked. Try after some time.')
        } else {
          user.isBlocked = false
          user.OTPAttempts = 0
        }
      }

      // Check for minimum 1-minute gap between OTP requests
      const lastOTPTime = user.OTPCreatedTime
      const currentTime = new Date()

      if (lastOTPTime && currentTime - lastOTPTime < 60000) {
        return res
          .status(403)
          .send('Minimum 1-minute gap required between OTP requests')
      }

      const OTP = generateOTP()
      user.OTP = OTP
      user.OTPCreatedTime = currentTime

      await user.save()

      sendOTP(email, OTP)

      res.status(200).send('OTP sent successfully')
    } catch (err) {
      console.log(err)
      res.status(500).send('Server error')
    }
  })
)

// api/register/
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body

    if (name.length <= 2) {
      res.sendStatus(401)
    } else if (password.length <= 5) {
      res.sendStatus(401)
    } else if (phone.length < 10) {
      res.sendStatus(401)
    } else {
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('Error:', err)
          return
        }

        const newUserData = {
          name,
          email,
          password: hash,
          phone,
          address: [],
        }

        const newUser = new User(newUserData)
        newUser.save()
        res.sendStatus(200)
      })
    }
  })
)

// api/login/
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    // send the jwt token as the response
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (user) {
      if (user.OTP == undefined) {
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
            console.error('Error:', err)
            return
          }

          if (isMatch) {
            const token = jwt.sign(
              { email: user.email },
              process.env.SECRET_KEY,
              {
                expiresIn: '1d',
              }
            )
            res.cookie('token', token, { httpOnly: true })
            res.send('Login successful')
          } else {
            res.status(401).send('Incorrect email/password')
          }
        })
      }
    } else {
      res
        .status(401)
        .send(
          'Email not registered yet. Please double-check or create a new account.'
        )
    }
  })
)

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.clearCookie('token', { httpOnly: true })

    res.sendStatus(200)
  })
)

// api/wishlist/add
router.post(
  '/wishlist/add',
  asyncHandler(async (req, res) => {
    // Get user email from token and send it to this api
    const { email, productId } = req.body

    // Find the user by email
    const user = await User.findOne({ email })

    if (user) {
      // Find or create the user's wishlist
      let wishlist = await Wishlist.findOne({ user: user._id })
      if (!wishlist) {
        wishlist = new Wishlist({ user: user._id, products: [] })
      }

      // Check if the product is already in the wishlist
      if (!wishlist.products.includes(productId)) {
        // Add the product to the wishlist
        wishlist.products.push(productId)
        await wishlist.save()
        res.status(200).send('Product added to wishlist.')
      } else {
        res.status(409).send('Product is already wishlisted.')
      }
    } else {
      res.status(404).send('User not found')
    }
  })
)

router.get(
  '/wishlist',
  asyncHandler(async (req, res) => {
    const { email } = req.query

    const user = await User.findOne({ email })
    const userId = user._id

    const wishlist_items = await Wishlist.find({ user: userId })

    if (wishlist_items) {
      res.send(wishlist_items[0].products)
    } else {
      res.sendStatus(404)
    }
  })
)

router.get(
  '/wishlist-products',
  asyncHandler(async (req, res) => {
    const { email } = req.query

    const user = await User.findOne({ email })
    const userId = user._id

    const wishlist_items = await Wishlist.find({ user: userId })
    const wishlist_product_ids_array = wishlist_items[0].products

    if (wishlist_product_ids_array.length > 0) {
      const products = await Promise.all(
        wishlist_product_ids_array.map(async (product_id) => {
          const product = await Product.findOne({ _id: product_id })
          return product
        })
      )
      res.send(products)
    } else {
      res.status(404).send('All your wishlisted products will appear here...')
    }
  })
)

router.delete('/wishlist/remove', async (req, res) => {
  try {
    const { email, itemId } = req.body

    if (!itemId) {
      return res.status(400).json({ error: 'Item ID not provided' })
    }

    // Find the Wishlist document based on the logged-in user
    const user = await User.findOne({ email })
    const userId = user._id // Assuming you have implemented authentication and stored the user object in the request
    const wishlist = await Wishlist.findOne({ user: userId })

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' })
    }

    // Filter out the item with the given itemId from the products array
    wishlist.products = wishlist.products.filter(
      (productId) => productId.toString() !== itemId
    )

    // Save the updated wishlist
    await wishlist.save()

    return res.status(200).json({ message: 'Item removed from wishlist' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/order/remove-product/:product_id', async (req, res) => {
  try {
    const { product_id } = req.params
    const { email } = req.body

    if (!product_id || !email) {
      return res.status(400).json({ error: 'Product ID or email not provided' })
    }

    // Find the user by email
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Find the user's active order with 'new' status
    const order = await Order.findOne({ user: user._id, status: 'new' })
      .populate('products.product')
      .exec()

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    console.log('Product Params ID:', product_id)
    // Find the index of the product in the order's products array
    const productIndex = order.products.findIndex(
      (product) => product.product._id.toString() === product_id
    )

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found in order' })
    }

    // Calculate the price of the product to be removed
    const productToRemove = order.products[productIndex]

    console.log(productToRemove)

    const priceOfProductToRemove =
      productToRemove.product.price -
      (productToRemove.product.discount / 100) * productToRemove.product.price

    // Update the totalAmount by subtracting the price of the product to be removed
    order.totalAmount -= priceOfProductToRemove * productToRemove.quantity

    // Remove the product from the products array
    order.products.splice(productIndex, 1)

    // Save the updated order
    await order.save()

    return res
      .status(200)
      .json({ message: 'Product removed from order', order })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get(
  '/cart-items',
  asyncHandler(async (req, res) => {
    const { email } = req.query

    const user = await User.findOne({ email })
    const userId = user._id

    const cart_items = await Order.find({ user: userId })
    const cart_products_ids_array = cart_items[0].products

    if (cart_products_ids_array.length > 0) {
      const products = await Promise.all(
        cart_products_ids_array.map(async (product_id) => {
          const product = await Product.findOne({ _id: product_id.product })
          return product
        })
      )
      res.send(products)
    } else {
      res.status(404).send('Your cart will appear here...')
    }
  })
)

router.get(
  '/cart/info',
  asyncHandler(async (req, res) => {
    const { email } = req.query

    const user = await User.findOne({ email })
    const userId = user._id

    const order_summary = await Order.find({ user: userId, status: 'new' })
      .populate('products.product')
      .exec()

    if (order_summary.length > 0) {
      let totalAmount = 0
      order_summary[0].products.forEach((product) => {
        const price =
          product.product.price -
          (product.product.discount / 100) * product.product.price
        totalAmount += price * product.quantity
      })

      await Order.findByIdAndUpdate(
        order_summary[0]._id,
        { totalAmount },
        { new: true }
      )

      const updatedOrderSummary = await Order.findById(order_summary[0]._id)
        .populate('products.product')
        .exec()

      res.send(updatedOrderSummary)
    } else {
      res.status(404).send('No orders found.')
    }
  })
)

router.get('/cart/:product_id/quantity', async (req, res) => {
  try {
    const { product_id } = req.params
    const { email } = req.query

    const user = await User.findOne({ email })
    const userId = user._id
    const order = await Order.findOne({
      user: userId,
      'products.product': product_id,
      status: 'new',
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    const product = order.products.find((product) =>
      product.product.equals(product_id)
    )

    if (!product) {
      return res.status(404).json({ error: 'Product not found in order.' })
    }

    const productQuantity = product.quantity
    res.send(productQuantity.toString())
  } catch {
    res.status(500).send('something went wrong')
  }
})

router.patch('/cart/:product_id/update-quantity', async (req, res) => {
  try {
    const { product_id } = req.params
    const { quantity, email } = req.body

    const user = await User.findOne({ email })
    const userId = user._id

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity value.' })
    }

    const order = await Order.findOneAndUpdate(
      {
        user: userId,
        'products.product': product_id,
      },
      {
        $set: { 'products.$.quantity': quantity },
      },
      {
        new: true,
        populate: { path: 'products.product' },
      }
    ).exec()

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' })
    }

    const productToUpdate = order.products.find(
      (product) => product.product._id.toString() === product_id
    )

    if (!productToUpdate) {
      return res.status(404).json({ error: 'Product not found in order.' })
    }

    // Recalculate totalAmount for the order (optional, you can also update it separately)
    let totalAmount = 0
    order.products.forEach((product) => {
      const price =
        product.product.price -
        (product.product.discount / 100) * product.product.price
      totalAmount += price * product.quantity
    })
    order.totalAmount = totalAmount
    await order.save()

    console.log(order)
    res.status(200).json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Internal server error.' })
  }
})

router.post(
  '/cart/add',
  asyncHandler(async (req, res) => {
    const { email, productId, quantity } = req.body

    const user = await User.findOne({ email })

    if (user) {
      // Find or create the user's wishlist (Order in this case)
      let cart = await Order.findOne({ user: user._id })
      if (!cart) {
        cart = new Order({ user: user._id, products: [] })
      }

      // Check if the product is already in the wishlist
      const existingProduct = cart.products.find(
        (item) => item.product.toString() === productId
      )

      if (!existingProduct) {
        // Add the product to the wishlist
        const newProduct = {
          product: productId,
          quantity,
        }
        cart.products.push(newProduct)
        await cart.save()
        res.status(200).send('Product added to cart.')
      } else {
        res.status(409).send('Product is already in cart.')
      }
    } else {
      res.status(404).send('User not found')
    }
  })
)

router.get(
  '/address/:email',
  asyncHandler(async (req, res) => {
    const { email } = req.params

    const user = await User.findOne({ email })

    res.send(user.address)
  })
)

module.exports = router
