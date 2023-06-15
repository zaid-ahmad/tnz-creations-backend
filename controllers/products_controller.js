const asyncHandler = require('express-async-handler')

exports.index = (req, res) => {
    res.render('products_list', { title: 'Showing 92 products' })
}

exports.product_detail_get = (req, res) => {
    res.json({ IMPLEMENT: 'product detail view' })
}

exports.product_create_get = (req, res) => {
    res.json({ IMPLEMENT: 'product create view' })
}

exports.product_update_get = (req, res) => {
    res.json({ IMPLEMENT: 'product update view' })
}

exports.product_delete_get = (req, res) => {
    res.json({ IMPLEMENT: 'product delete view' })
}

exports.product_create_post = asyncHandler(async (req, res) => {
    res.json({ IMPLEMENT: 'create update' })
})

exports.product_update_post = asyncHandler(async (req, res) => {
    res.json({ IMPLEMENT: 'product update' })
})

exports.product_delete_post = asyncHandler(async (req, res) => {
    res.json({ IMPLEMENT: 'product delete' })
})

//tausif@#Tnzcreations99110
