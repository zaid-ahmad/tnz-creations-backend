const Category = require('../models/category')

const asyncHandler = require('express-async-handler')
const { body, validationResult } = require('express-validator')

exports.add_category_get = (req, res) => {
    // res.render('category_form', { title: 'Create New Category' })
    res.render('create_cat')
}

exports.add_category_post = [
    body('category', 'Category name must contain at least 3 characters')
        .trim()
        .isLength({ min: 3 })
        .escape()
        .customSanitizer((value) => {
            // Capitalize the category
            const capitalizedCategory =
                value.charAt(0).toUpperCase() + value.slice(1)
            return capitalizedCategory
        }),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req)
        const category = new Category({ name: req.body.category })

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('create_cat', {
                errors: errors.array(),
            })
            return
        } else {
            // Data from form is valid.
            // Check if Category with same name already exists.
            const categoryExists = await Category.findOne({
                name: req.body.category,
            }).exec()
            if (categoryExists) {
                // Category exists, redirect to its detail page.
                const context = 'Category already exists'
                res.redirect(`/?context=${encodeURIComponent(context)}`)
            } else {
                await category.save()
                // New category saved. Redirect to genre detail page.
                const context = 'Category created successfully'
                res.redirect(
                    `/category/products?context=${encodeURIComponent(context)}`
                )
            }
        }
    }),
]
