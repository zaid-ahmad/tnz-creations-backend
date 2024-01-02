const Product = require("../models/product");
const Category = require("../models/category");

const asyncHandler = require("express-async-handler");
const fs = require("fs");
const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();
const { body, validationResult } = require("express-validator");
const { randomBytes } = require("crypto");
const sharp = require("sharp");

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion,
});

const randomImageName = (bytes = 32) => randomBytes(bytes).toString("hex");

exports.index = asyncHandler(async (req, res) => {
    const context = req.query.context;
    const [allProducts, allCategories] = await Promise.all([
        Product.find().populate("category").exec(),
        Category.find().exec(),
    ]);

    res.render("products_list", {
        message: context,
        products_list: allProducts,
        category: allCategories,
    });
});

exports.index.post = asyncHandler(async (req, res) => {
    const cat = req.body.category;

    if (cat !== "all") {
        const selected = await Category.find({ _id: `${cat}` }).exec();
        const [allProducts, allCategories] = await Promise.all([
            Product.find({ category: `${cat}` })
                .populate("category")
                .exec(),
            Category.find().exec(),
        ]);

        res.render("products_list", {
            products_list: allProducts,
            category: allCategories,
            selectedCategory: selected[0].name,
        });
    } else {
        const [allProducts, allCategories] = await Promise.all([
            Product.find().populate("category").exec(),
            Category.find().exec(),
        ]);

        res.render("products_list", {
            products_list: allProducts,
            category: allCategories,
            selectedCategory: "all",
        });
    }
});

exports.product_detail_get = asyncHandler(async (req, res) => {
    const [product] = await Promise.all([
        Product.findById(req.params.id).populate("category").exec(),
    ]);

    const dimensions_formatted = product.dimensions
        .join(" x ")
        .replace(/,/g, " x ");

    res.render("product_detail", {
        name: product.name,
        images: product.images,
        price: product.price,
        discount: product.discount,
        category: product.category,
        description: product.description,
        colors: product.colors,
        stock: product.stock,
        weight: product.weight,
        dimensions: dimensions_formatted,
        id: product._id,
    });
});

exports.product_create_get = asyncHandler(async (req, res, next) => {
    const [allCategories] = await Promise.all([Category.find().exec()]);
    res.render("create_prod", {
        context: "",
        category: allCategories,
    });
});

exports.product_update_get = asyncHandler(async (req, res) => {
    const [product, allCategories] = await Promise.all([
        Product.findById(req.params.id).populate("category").exec(),
        Category.find().exec(),
    ]);

    for (const category of allCategories) {
        if (category._id.toString() === product.category._id.toString()) {
            category.checked = "true";
        }
    }

    res.render("update_prod", {
        product: product,
        category: allCategories,
    });
});

exports.product_delete_get = asyncHandler(async (req, res) => {
    const [product] = await Promise.all([
        Product.findById(req.params.id).populate("category").exec(),
    ]);

    const dimensions_formatted = product.dimensions
        .join(" x ")
        .replace(/,/g, " x ");

    res.render("product_delete", {
        name: product.name,
        images: product.images,
        price: product.price,
        discount: product.discount,
        category: product.category,
        description: product.description,
        colors: product.colors,
        stock: product.stock,
        weight: product.weight,
        dimensions: dimensions_formatted,
        id: product._id,
        product: product,
    });
});

exports.product_create_post = [
    (req, res, next) => {
        if (!(req.body.colors instanceof Array)) {
            if (typeof req.body.colors === "undefined") req.body.colors = [];
            else {
                const colors = req.body.colors.split(" ");
                req.body.colors = colors;
            }
        }
        next();
    },

    (req, res, next) => {
        if (!(req.body.dimensions instanceof Array)) {
            if (typeof req.body.dimensions === "undefined")
                req.body.dimensions = [];
            else {
                const dimension = req.body.dimensions.split(" ");
                req.body.dimensions = dimension;
            }
        }
        next();
    },

    body("product", "Name must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("price", "Price must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("discount", "Discount must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("description", "Description must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("stock", "Stock must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("weight", "Weight must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);

        let imageNames = [];

        await Promise.all(
            req.files.map(async (file) => {
                const buffer = await sharp(file.buffer)
                    .resize({ height: 355, width: 355, fit: "fill" })
                    .toBuffer();
                const imageName = randomImageName();

                imageNames.push(imageName);

                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                    Body: buffer,
                    ContentType: file.mimetype,
                };
                const command = new PutObjectCommand(params);

                await s3.send(command);
            })
        );

        const product = new Product({
            name: req.body.product,
            images: imageNames,
            price: req.body.price,
            discount: req.body.discount,
            category: req.body.category,
            description: req.body.description,
            colors: req.body.colors,
            stock: req.body.stock,
            weight: req.body.weight,
            dimensions: req.body.dimensions,
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            const [allCategories] = await Promise.all([Category.find().exec()]);
            res.render("create_prod", {
                category: allCategories,
                errors: errors.array(),
            });
        } else {
            // Data from form is valid. Save book.
            await product.save();
            const context = "Product created successfully";
            res.redirect(
                `/inventory/products?context=${encodeURIComponent(context)}`
            );
        }
    }),
];

exports.product_update_post = [
    (req, res, next) => {
        if (!(req.body.colors instanceof Array)) {
            if (typeof req.body.colors === "undefined") req.body.colors = [];
            else {
                const colors = req.body.colors.split(" ");
                req.body.colors = colors;
            }
        }
        next();
    },

    (req, res, next) => {
        if (!(req.body.dimensions instanceof Array)) {
            if (typeof req.body.dimensions === "undefined")
                req.body.dimensions = [];
            else {
                const dimension = req.body.dimensions.split(" ");
                req.body.dimensions = dimension;
            }
        }
        next();
    },

    body("product", "Name must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("price", "Price must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("discount", "Discount must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("description", "Description must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("stock", "Stock must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body("weight", "Weight must not be empty.")
        .trim()
        .isLength({ min: 1 })
        .escape(),

    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        const oldProduct = await Product.findById(req.params.id);

        const product = new Product({
            name: req.body.product,
            images: oldProduct.images,
            price: req.body.price,
            discount: req.body.discount,
            category: req.body.category,
            description: req.body.description,
            colors: req.body.colors,
            stock: req.body.stock,
            weight: req.body.weight,
            dimensions: req.body.dimensions,
            _id: req.params.id,
        });

        if (req.file) {
            // 1. see the position, delete that from s3
            const position = req.body.position;
            const params = {
                Bucket: bucketName,
                Key: oldProduct.images[position - 1],
            };

            const command = new DeleteObjectCommand(params);

            await s3.send(command);
            // 2. upload the given image to s3
            const buffer = await sharp(req.file.buffer)
                .resize({ height: 355, width: 355, fit: "fill" })
                .toBuffer();
            const imageName = randomImageName();

            const params2 = {
                Bucket: bucketName,
                Key: imageName,
                Body: buffer,
                ContentType: req.file.mimetype,
            };
            const command2 = new PutObjectCommand(params2);

            await s3.send(command2);
            // 3. upload the new name in the specified position in the array
            product.images[position - 1] = imageName;
        } else {
            // No new image uploaded, retain the old images
            product.images = oldProduct.images;
        }

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/error messages.
            const [allCategories] = await Promise.all([Category.find().exec()]);
            res.render("update_prod", {
                category: allCategories,
                errors: errors.array(),
            });
        } else {
            // Data from form is valid. Save product.
            const theprod = await Product.findByIdAndUpdate(
                req.params.id,
                product,
                {}
            );
            const context = "Product updated successfully";
            res.redirect(
                `/inventory/products?context=${encodeURIComponent(context)}`
            );
        }
    }),
];

exports.product_delete_post = asyncHandler(async (req, res) => {
    const [product] = await Promise.all([
        Product.findById(req.params.id).populate("category").exec(),
    ]);

    if (product === null) {
        console.log("ITS NULL");
    } else {
        // IMAGE DELETION HERE

        await Promise.all(
            product.images.map(async (imageName) => {
                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                };

                const command = new DeleteObjectCommand(params);

                await s3.send(command);
            })
        );

        await Product.findByIdAndRemove(req.body.id);
        const context = "Product deleted successfully";
        res.redirect(
            `/inventory/products?context=${encodeURIComponent(context)}`
        );
    }
});
