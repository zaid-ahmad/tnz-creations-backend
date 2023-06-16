const createError = require('http-errors')
const express = require('express')
const path = require('path')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const mongoose = require('mongoose')

require('dotenv').config()

const indexRouter = require('./routes/index')
const categoryRouter = require('./routes/category')

const Admin = require('./models/admin')

mongoose.set('strictQuery', false)

// Set up mongoose connection
const mongoDB = process.env.MONGO_URI

main().catch((err) => console.log(err))
async function main() {
    await mongoose.connect(mongoDB)
    console.log('Connected to database')
}

const app = express()

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

app.get('/', (req, res) => {
    const context = req.query.context
    res.render('index', { user: req.user, message: context })
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            // Handle error
            return next(err)
        }
        if (!user) {
            // Render login page with error message
            return res.render('index', {
                message: info.message,
                createCatMsg: '',
            })
        }
        // User authenticated successfully
        req.login(user, (err) => {
            if (err) {
                // Handle error
                return next(err)
            }
            // Redirect to a different page
            return res.redirect('/')
        })
    })(req, res, next)
})

app.use('/category', categoryRouter)

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

/*
    To implement tomorrow:
        1. Add new product
        2. Display all products
        

    TODOs for the entire web appl.
        1. Detailed product view
        2. Update product details
        3. Delete product
        4. Update category name
        5. Delete a category
*/
