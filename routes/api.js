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
    const wishlist_items = await Wishlist.find()

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
    const wishlist_items = await Wishlist.find()
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
    console.log(email, itemId)
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

module.exports = router

/*

  Done:
  ✅ POST - Account creation
  ✅ POST - Login
  ✅ POST(s) - Email verification
  ✅ POST (api/wishlist/add)

  TODO's:
  -> ✅ GET (api/products) - products (image, name, price, discount, reviews)
     ✅GET (api/products?category=xxx)
     ✅GET (api/products?priceMin=xxx&priceMax=xxx)
     ✅GET (api/products?name=xxx) aka. search

  -> GET (api/orderHistory)
  -> GET (api/orderHistory)

  -> POST (api/order)
*/
