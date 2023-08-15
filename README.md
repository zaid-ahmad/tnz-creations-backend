# Backend for tnzcreations.com 

You can find the frontend repository here: [TNZ Creations Frontend](https://github.com/zaid-ahmad/tnz-creations-frontend)

Live URL: [TNZ Creations Admin Panel](https://tnzcreationsinventory.up.railway.app/)

> Access to the admin page is restricted to admins only.

## Tech Stack 💻

-   Node
-   Express
-   PUG
-   MongoDB
-   CSS

## How things work?

### Overview
This project is a server-side rendered (SSR) application that uses PUG to display the contents of a MongoDB database. The admin can:

- View all orders
- Sort orders by status
- View all products
- Perform CRUD operations on products

## Image Storage
This SSR application serves as a panel for the MongoDB database. The images are not stored on a service like AWS or Google Cloud because the budget for the website was not high. Instead, the images are stored in the directory itself using multer.

This has a few caveats. First, if you push new changes to the application, all of the images will be lost. This is because the way the images are displayed in the backend is by simply using the link to the image, such as https://tnzcreationsinventory.up.railway.app/public/images/uploads/<file_name>. When you push new changes, the directory is cleared and the /public/images/uploads directory becomes empty.

In the future, I may change this by storing the images in a service like AWS or Google Cloud. This would prevent the images from being lost when you push new changes.

### Payment
The payment gateway for this application is integrated with Razorpay. Razorpay can accept payments from customers and automate payouts to vendors and employees. It is available in India and Malaysia only.

## Show your support

Give a ⭐ if you like this project!
