const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    },
})
const upload = multer({ storage: storage })

const category_controller = require('../controllers/category_controller')
const products_controller = require('../controllers/products_controller')

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next()
    else res.redirect('/')
}

////////////////////
/* CATEGORY ROUTES */
////////////////////

router.get('/new', ensureAuthenticated, category_controller.add_category_get)
router.get(
    '/update',
    ensureAuthenticated,
    category_controller.update_category_get
)
router.get(
    '/delete',
    ensureAuthenticated,
    category_controller.delete_category_get
)

router.post('/new', category_controller.add_category_post)
router.post('/update', category_controller.update_category_post)
router.post('/delete', category_controller.delete_category_post)

////////////////////
/* PRODUCT ROUTES */
////////////////////

/* GET request for home page. */
router.get('/products/', ensureAuthenticated, products_controller.index)

/* GET request for add product page. */
router.get(
    '/products/create',
    ensureAuthenticated,
    products_controller.product_create_get
)

/* GET request for product detail page. */
router.get(
    '/products/:id',
    ensureAuthenticated,
    products_controller.product_detail_get
)

/* GET request for update product page */
router.get(
    '/products/:id/update',
    ensureAuthenticated,
    products_controller.product_update_get
)

/* GET request for delete product page */
router.get(
    '/products/:id/delete',
    ensureAuthenticated,
    products_controller.product_delete_get
)

/* POST request for adding a product */
router.post(
    '/products/create',
    upload.single('image'),
    products_controller.product_create_post
)

/* POST request for one product */
router.post('/products/:id', (req, res) => {
    products_controller.product_detail_post
})

/* POST request for updating a product */
router.post('/products/:id/update', (req, res) => {
    products_controller.product_update_post
})

/* POST request for deleting a product */
router.post('/products/:id/delete', (req, res) => {
    products_controller.product_delete_post
})

module.exports = router
