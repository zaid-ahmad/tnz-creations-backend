const createError = require('http-errors')
const express = require('express')
const path = require('path')
const session = require('express-session')
const cors = require('cors')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mongoose = require('mongoose')
const compression = require('compression')
const helmet = require('helmet')

require('dotenv').config()

const indexRouter = require('./routes/index')
const inventoryRouter = require('./routes/inventory')
const apiRouter = require('./routes/api')
const paymentRoute = require('./routes/payment')
const ordersRouter = require('./routes/orders')

const Admin = require('./models/admin')
const Product = require('./models/product')

mongoose.set('strictQuery', false)

// Set up mongoose connection
const mongoDB = process.env.MONGO_URI

main().catch((err) => console.log(err))
async function main() {
  await mongoose.connect(mongoDB)
  console.log('Connected to database')
}

const app = express()

app.use(compression())
app.use(helmet())
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true, // Enable sending cookies in the response
  })
)
// Apply rate limiter to all requests

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// Auth setup

app.use(
  session({
    secret: 'cats',
    resave: false,
    saveUninitialized: true,
  })
)

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const admin = await Admin.findOne({ username: username })
      if (!admin) {
        return done(null, false, {
          message: 'Incorrect username or, password.',
        })
      }

      bcrypt.compare(password, admin.password, (err, res) => {
        if (res) {
          // passwords match! log user in
          return done(null, admin)
        } else {
          // passwords do not match!
          return done(null, false, {
            message: 'Incorrect username or, password.',
          })
        }
      })
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser(function (admin, done) {
  done(null, admin.id)
})

passport.deserializeUser(async function (id, done) {
  try {
    const admin = await Admin.findById(id)
    done(null, admin)
  } catch (err) {
    done(err)
  }
})

app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({ extended: false }))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'public/images')))

app.get('/', (req, res) => {
  const context = req.query.context
  res.render('index', { user: req.user, message: context })
})

app.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      // Handle error
      return next(err)
    }
    if (!user) {
      // Render login page with error message

      return res.render('index', {
        message: info.message,
      })
    }
    // User authenticated successfully
    req.login(user, (err) => {
      if (err) {
        // Handle error
        return next(err)
      }
      // Redirect to a different page
      return res.redirect('/inventory/products/')
    })
  })(req, res, next)
})

app.use('/inventory', inventoryRouter)
app.use('/orders', ordersRouter)
app.use('/api', apiRouter)
app.use('/payment', paymentRoute)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
