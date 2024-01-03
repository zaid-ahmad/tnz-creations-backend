const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fieldSize: 25 * 1024 * 1024 },
}).array("images", 5);

const uploadForUpdate = multer({
    storage: storage,
    limits: { fieldSize: 25 * 1024 * 1024 },
}).fields([
    {
        name: "image",
        maxCount: 1,
    },
    {
        name: "images",
        maxCount: 4,
    },
]);

const category_controller = require("../controllers/category_controller");
const products_controller = require("../controllers/products_controller");

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    else res.redirect("/");
}

////////////////////
/* CATEGORY ROUTES */
////////////////////

router.get("/new", ensureAuthenticated, category_controller.add_category_get);
router.post("/new", category_controller.add_category_post);

////////////////////
/* PRODUCT ROUTES */
////////////////////

/* GET request for home page. */
router.get("/products/", ensureAuthenticated, products_controller.index);
router.post("/products/", ensureAuthenticated, products_controller.index.post);

/* GET request for add product page. */
router.get(
    "/products/create",
    ensureAuthenticated,
    products_controller.product_create_get
);

/* GET request for product detail page. */
router.get(
    "/products/:id",
    ensureAuthenticated,
    products_controller.product_detail_get
);

/* GET request for update product page */
router.get(
    "/products/:id/update",
    ensureAuthenticated,
    products_controller.product_update_get
);

/* GET request for delete product page */
router.get(
    "/products/:id/delete",
    ensureAuthenticated,
    products_controller.product_delete_get
);

/* POST request for adding a product */
router.post(
    "/products/create",
    ensureAuthenticated,
    upload,
    products_controller.product_create_post
);

/* POST request for one product */
router.post("/products/:id", ensureAuthenticated, (req, res) => {
    products_controller.product_detail_post;
});

/* POST request for updating a product */
router.post(
    "/products/:id/update",
    ensureAuthenticated,
    uploadForUpdate,
    products_controller.product_update_post
);

/* POST request for deleting a product */
router.post(
    "/products/:id/delete",
    ensureAuthenticated,
    upload,
    products_controller.product_delete_post
);

module.exports = router;
