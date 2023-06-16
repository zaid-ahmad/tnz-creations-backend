const asyncHandler = require('express-async-handler')
const Product = require('../models/product')
const Category = require('../models/category')

exports.index = (req, res) => {
    res.render('products_list', { title: 'Showing 92 products' })
}

exports.product_detail_get = (req, res) => {
    res.json({ IMPLEMENT: 'product detail view' })
}

exports.product_create_get = asyncHandler(async (req, res, next) => {
    const [allCategories] = await Promise.all([Category.find().exec()])
    res.render('create_prod', {
        category: allCategories,
    })
    console.log(allCategories)
})

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
