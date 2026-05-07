# 🛒 ZooCart - Enterprise E-Commerce Platform

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-blue?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.12-green?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)](https://github.com)

A production-ready, full-stack e-commerce platform built with **Node.js**, **Express**, and **MongoDB**. ZooCart implements enterprise-grade architecture patterns with OAuth 2.0 authentication, microservices-ready controller design, secure payment processing, and scalable database design.

## 📋 Quick Navigation

- [System Architecture](#system-architecture)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer (EJS)                          │
│                    Bootstrap + SCSS + jQuery                        │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                    Middleware Layer                                 │
│              ┌─────────────────────────────────────┐               │
│              │ Authentication  │  Session         │               │
│              │ CSRF Protection │  Error Handling  │               │
│              │ File Upload     │  Validation      │               │
│              └─────────────────────────────────────┘               │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                     Route Layer                                     │
│           ┌─────────────────┬──────────────────┐                  │
│           │  User Routes    │  Admin Routes    │                  │
│           └─────────────────┴──────────────────┘                  │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│              Business Logic Layer (Controllers)                     │
│     ┌──────────┬──────────┬──────────┬──────────────────┐          │
│     │ Product  │  Order   │  Cart    │  User Management │          │
│     │ Payment  │  Coupon  │  Wallet  │  Analytics       │          │
│     └──────────┴──────────┴──────────┴──────────────────┘          │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│                   Data Layer (Models)                               │
│        ┌──────────────────────────────────────────────────┐        │
│        │  Mongoose Schema Validation & Indexing          │        │
│        │  ┌──────────┬────────┬─────────┬──────────┐     │        │
│        │  │ Products │ Orders │  Users  │ Payments │     │        │
│        │  │ Cart     │ Reviews│ Coupons │ Banners  │     │        │
│        │  └──────────┴────────┴─────────┴──────────┘     │        │
│        └──────────────────────────────────────────────────┘        │
└─────────────────────┬───────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────────┐
│              External Services Integration                          │
│  ┌────────────────┬─────────────────┬──────────────────────┐       │
│  │ MongoDB Atlas  │ Razorpay Payment│ Cloudinary Storage   │       │
│  │ Nodemailer     │ Google OAuth 2.0│ Session Store (MongoDB)     │
│  └────────────────┴─────────────────┴──────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Core Features

### 🔐 Authentication & Authorization
- **Dual Authentication**: Email/password with bcrypt hashing + Google OAuth 2.0 via Passport.js
- **Session Management**: Express-session with MongoDB store for persistent sessions
- **Role-Based Access Control**: User vs Admin role separation with middleware protection
- **Secure Password Storage**: Bcrypt with salt rounds for cryptographic security

### 🛍 User Features
- **Advanced Product Discovery**: Browse by category/brand with filtering and search
- **Shopping Cart Management**: Real-time cart updates with quantity adjustments
- **Wishlist Functionality**: Persistent wishlist with add/remove capabilities
- **Secure Checkout**: Multi-step checkout process with order summary validation
- **Multiple Addresses**: Support for billing and shipping address management
- **Payment Processing**: Razorpay integration with webhook handling
- **Order Tracking**: Real-time order status tracking and history
- **Review System**: Product reviews with rating aggregation
- **Wallet System**: Digital wallet for refunds and store credit

### 👨‍💼 Admin Features
- **Analytics Dashboard**: Real-time sales metrics, order statistics, and customer insights
- **Product Management**: CRUD operations with image optimization via Sharp
- **Inventory Management**: Stock tracking and low-stock alerts
- **Order Management**: Order fulfillment workflow with status updates
- **Customer Management**: User account management and activity monitoring
- **Promotional System**: Coupon creation, validation, and tracking
- **Banner Management**: Homepage promotional banner system
- **Report Generation**: PDF and Excel export with ExcelJS/PDFMake
- **Data Export**: Bulk export capabilities for business intelligence

---

## 📸 Project Screenshots

### Home Page
![Home Page](./assets/home.png)

### Shop Page
![Shop Page](./assets/shop.png)

### Shopping Cart
![Shopping Cart](./assets/cart.png)

### Product Details Page
![Product Page](./assets/productPage.png)

### Admin Dashboard
![Admin Dashboard](./assets/adminDashboard.png)

---

## 🛠 Technology Stack

### Backend Architecture
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Node.js v14+ | JavaScript runtime environment |
| **Framework** | Express.js 4.21 | Web application framework |
| **Language** | JavaScript (ES6+) | Primary development language |
| **API Pattern** | RESTful | Standard HTTP API design |

### Database & Persistence
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Primary DB** | MongoDB 6.12 | NoSQL document database |
| **ODM** | Mongoose 8.9.5 | Schema validation & relationships |
| **Session Store** | connect-mongo 5.1.0 | Server-side session persistence |
| **Query Optimization** | Mongoose Indexing | Performance optimization |

### Authentication & Security
| Feature | Technology | Details |
|---------|-----------|---------|
| **Local Auth** | bcrypt 5.1.1 | Password hashing with salt |
| **OAuth 2.0** | Passport.js 0.7.0, Google OAuth 2.0 | Social authentication |
| **Session** | express-session 1.18.1 | Stateful session management |
| **Session Secret** | Environment-based | Secure session encryption |

### Frontend Technologies
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Templating Engine** | EJS 3.1.10 | Server-side template rendering |
| **Styling Framework** | Bootstrap 5 | Responsive CSS framework |
| **CSS Preprocessing** | SCSS | Enhanced CSS with variables/mixins |
| **JavaScript** | jQuery 3.3.1 | DOM manipulation & utilities |
| **Image Gallery** | Magnific Popup | Responsive image lightbox |
| **Carousel** | Owl Carousel 2 | Multi-item carousel plugin |
| **Filtering** | MixItUp | Advanced content filtering |
| **Countdown** | jQuery Countdown | Event timer functionality |
| **Autocomplete** | Nice Select | Enhanced select dropdowns |

### External Services
| Service | Library | Purpose |
|---------|---------|---------|
| **Payment Gateway** | Razorpay 2.9.6 | PCI-compliant payment processing |
| **Cloud Storage** | Cloudinary 2.5.1 | Image hosting & optimization |
| **Email Service** | Nodemailer 6.10.0 | SMTP-based email delivery |
| **Image Processing** | Sharp 0.33.5 | Fast image resizing/optimization |
| **PDF Generation** | PDFMake 0.2.18 | Server-side PDF report generation |
| **Excel Export** | ExcelJS 4.4.0 | Spreadsheet file creation |
| **File Upload** | Multer 1.4.5 | Multipart form-data handling |
| **Unique IDs** | UUID 11.1.0 | Transaction ID generation |

### Development & Deployment
- **Package Manager**: npm (Node Package Manager)
- **Node Version**: v14.0.0 or higher
- **Environment Management**: dotenv 16.4.7

---

## 📋 Prerequisites

### System Requirements
```
Node.js:        >= 14.0.0
npm:            >= 6.0.0 (or yarn 1.22+)
MongoDB:        >= 4.4 (local) or MongoDB Atlas cluster
RAM:            Minimum 512MB (recommended 2GB)
Disk Space:     Minimum 500MB
```

### External Services Required
1. **MongoDB Atlas** - Cloud database (or local MongoDB instance)
2. **Razorpay Account** - Payment gateway credentials
3. **Cloudinary Account** - Cloud image storage
4. **Gmail Account** - For Nodemailer SMTP (or other email service)
5. **Google OAuth App** - For social authentication

---

## 🚀 Installation & Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/ZooCart-project.git
cd ZooCart-project
```

### Step 2: Install Dependencies
```bash
npm install
# or
yarn install
```

### Step 3: Environment Configuration
Create a `.env` file in the project root:
```bash
cp .env.example .env  # if template exists
# or create manually
touch .env
```

### Step 4: Database Setup
```bash
# Ensure MongoDB is running
# For local MongoDB:
mongod

# For MongoDB Atlas, get connection string from dashboard
```

### Step 5: Start Application
```bash
# Development mode
npm start

# With auto-restart (requires nodemon)
npx nodemon app.js
```

Server will start on `http://localhost:3000` (or configured PORT)

---

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file with the following configuration:

```env
# === Application Settings ===
PORT=3000
NODE_ENV=development

# === Database Configuration ===
MONGODB_URI=mongodb://localhost:27017/zoocart
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zoocart?retryWrites=true&w=majority

# === Session Configuration ===
SESSION_SECRET=your_strong_secret_key_minimum_32_characters
SESSION_MAX_AGE=7200000  # 2 hours in milliseconds

# === Cloudinary Configuration (Image Storage) ===
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# === Razorpay Configuration (Payment Gateway) ===
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# === Email Configuration (SMTP) ===
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password  # Use app password for Gmail
EMAIL_FROM=noreply@zoocart.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# === Google OAuth Configuration ===
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/user/auth/google/callback

# === Admin Credentials (Development Only) ===
ADMIN_EMAIL=admin@zoocart.com
ADMIN_PASSWORD=secure_admin_password

# === Logging & Debugging ===
DEBUG=zoocart:*
LOG_LEVEL=info  # error, warn, info, debug
```

### Configuration File Locations
- **Database**: [`config/db.js`](config/db.js)
- **Cloudinary**: [`config/cloudinary.js`](config/cloudinary.js)
- **Passport**: [`config/passport.js`](config/passport.js)
- **Razorpay**: [`config/razorpay.js`](config/razorpay.js)

### Security Best Practices
⚠️ **IMPORTANT**: Never commit `.env` file to repository
- Add `.env` to `.gitignore`
- Use strong, unique session secrets
- Keep API keys confidential
- Rotate secrets periodically in production
- Use environment-specific configurations

---

## �️ Database Schema & Design

### Data Models Overview

#### User Schema
```javascript
{
  _id: ObjectId,
  email: String (unique, lowercase),
  phone: String,
  password: String (bcrypt hashed),
  firstName: String,
  lastName: String,
  googleId: String (optional, for OAuth),
  isBlocked: Boolean,
  role: Enum['user', 'admin'],
  profile: {
    avatar: String (Cloudinary URL),
    phone: String,
    gender: String
  },
  createdAt: Date (indexed),
  updatedAt: Date
}
```

#### Product Schema
```javascript
{
  _id: ObjectId,
  name: String (indexed),
  description: String,
  category: ObjectId (Reference: CategorySchema),
  brand: ObjectId (Reference: BrandSchema),
  price: Number (indexed),
  salePrice: Number,
  quantity: Number,
  images: [String] (Cloudinary URLs),
  rating: Number,
  status: Enum['active', 'inactive'],
  createdAt: Date (indexed),
  updatedAt: Date
}
```

#### Order Schema
```javascript
{
  _id: ObjectId,
  orderId: String (unique, custom generated),
  userId: ObjectId (Reference: UserSchema, indexed),
  items: [{
    productId: ObjectId,
    quantity: Number,
    price: Number
  }],
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  totalPrice: Number,
  discount: Number,
  finalAmount: Number,
  paymentStatus: Enum['pending', 'completed', 'failed'],
  orderStatus: Enum['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
  paymentMethod: Enum['card', 'upi', 'wallet'],
  razorpayOrderId: String,
  razorpayPaymentId: String,
  createdAt: Date (indexed),
  expectedDelivery: Date
}
```

#### Cart Schema
```javascript
{
  _id: ObjectId,
  userId: ObjectId (Reference: UserSchema, unique, indexed),
  items: [{
    productId: ObjectId (Reference: ProductSchema),
    quantity: Number,
    price: Number
  }],
  totalPrice: Number,
  updatedAt: Date
}
```

#### Additional Schemas
- **Category**: Category management with slug
- **Brand**: Brand information and logos
- **Coupon**: Discount codes with expiry and usage limits
- **Order**: Complete order tracking with payment details
- **Payment**: Transaction records with Razorpay integration
- **Review**: Product reviews with ratings and user references
- **Wishlist**: User favorite products collection
- **Wallet**: Digital wallet for store credit
- **Banner**: Homepage promotional banners
- **Address**: User shipping address collection

### Indexing Strategy
```javascript
// Critical indexes for performance:
userSchema.index({ email: 1 });                    // Authentication lookups
userSchema.index({ createdAt: -1 });              // User analytics queries
productSchema.index({ name: 'text' });            // Full-text search
productSchema.index({ category: 1, price: 1 });   // Category browsing
orderSchema.index({ userId: 1, createdAt: -1 }); // User order history
cartSchema.index({ userId: 1 });                  // Cart operations
```

### Design Patterns Used
- **Referencing**: Product references Category (prevents data duplication)
- **Embedding**: Order embeds items array (transactional consistency)
- **Soft Deletes**: isBlocked flag instead of deletion (audit trail)
- **Timestamps**: Automatic createdAt & updatedAt for audit logging
- **Unique Constraints**: Email, orderId for data integrity

---

---

## 📁 Project Structure & Architecture

```
ZooCart-project/
├── app.js                           # Express app initialization & middleware setup
├── package.json                     # Dependencies & npm scripts
├── .env                            # Environment variables (⚠️ Not in repo)
├── .gitignore                      # Git ignore rules
│
├── config/                         # Configuration & service initialization
│   ├── db.js                       # MongoDB connection with Mongoose
│   ├── cloudinary.js               # Cloudinary image service config
│   ├── passport.js                 # Passport.js auth strategies (Local + Google OAuth)
│   └── razorpay.js                 # Razorpay payment gateway initialization
│
├── controllers/                    # Business logic layer (MVC pattern)
│   ├── admin/                      # Admin dashboard controllers
│   │   ├── adminController.js      # Admin auth & operations
│   │   ├── productController.js    # Product CRUD operations
│   │   ├── categoryController.js   # Category management
│   │   ├── brandController.js      # Brand management
│   │   ├── orderController.js      # Order management & fulfillment
│   │   ├── couponController.js     # Promotional coupon handling
│   │   ├── customerController.js   # Customer account management
│   │   ├── bannerController.js     # Banner CRUD operations
│   │   ├── walletController.js     # Wallet credit operations
│   │   └── dashboardController.js  # Analytics & reporting
│   │
│   └── user/                       # Customer-facing controllers
│       ├── userController.js       # User auth (register, login, logout)
│       ├── productController.js    # Product browsing & search
│       ├── cartController.js       # Shopping cart management
│       ├── checkoutController.js   # Checkout process & order creation
│       ├── profileController.js    # User profile & address management
│       ├── wishlistController.js   # Wishlist operations
│       └── paymentController.js    # Payment processing & webhooks
│
├── models/                         # Mongoose schemas (Data layer)
│   ├── userSchema.js               # User account model
│   ├── productSchema.js            # Product catalog model
│   ├── categorySchema.js           # Product category model
│   ├── brandSchema.js              # Brand information model
│   ├── cartSchema.js               # Shopping cart model
│   ├── orderSchema.js              # Order & transaction model
│   ├── paymentSchema.js            # Payment records model
│   ├── couponSchema.js             # Discount coupon model
│   ├── reviewSchema.js             # Product review model
│   ├── wishlistSchema.js           # Wishlist model
│   ├── addressSchema.js            # User address model
│   ├── walletSchema.js             # Digital wallet model
│   ├── bannerSchema.js             # Promotional banner model
│   └── transactionSchema.js        # Transaction log model
│
├── routes/                         # API route definitions
│   ├── adminRoutes.js              # Admin panel routes & middleware guards
│   └── userRoutes.js               # Customer routes & authentication
│
├── views/                          # EJS template files (Presentation layer)
│   ├── admin/                      # Admin dashboard templates
│   │   ├── adminlogin.ejs
│   │   ├── dashboard.ejs
│   │   ├── products.ejs
│   │   ├── orders.ejs
│   │   ├── customers.ejs
│   │   ├── coupons.ejs
│   │   └── ...
│   │
│   ├── user/                       # Customer-facing templates
│   │   ├── signup.ejs
│   │   ├── login.ejs
│   │   ├── home.ejs
│   │   ├── shop.ejs
│   │   ├── product-details.ejs
│   │   ├── cart.ejs
│   │   ├── checkout.ejs
│   │   ├── profile.ejs
│   │   └── ...
│   │
│   └── partials/                   # Reusable components
│       ├── header.ejs
│       ├── footer.ejs
│       ├── navbar.ejs
│       ├── sidebar.ejs
│       └── pagination.ejs
│
├── middlewares/                    # Express middleware functions
│   ├── auth.js                     # Authentication & authorization guards
│   ├── errorHandler.js             # Global error handling
│   ├── validation.js               # Input validation middleware
│   └── logger.js                   # Request logging
│
├── helpers/                        # Utility & helper functions
│   ├── emailSent.js                # Email service (SMTP with Nodemailer)
│   ├── multer.js                   # File upload configuration & storage
│   ├── transactionId.js            # Unique ID generation for orders
│   ├── imageOptimization.js        # Image processing with Sharp
│   └── pdfGenerator.js             # PDF report generation
│
├── public/                         # Static assets (served by Express.static)
│   ├── css/
│   │   ├── style.css               # Main stylesheet
│   │   ├── responsive.css          # Mobile responsive styles
│   │   ├── bootstrap.min.css       # Bootstrap framework
│   │   └── ...
│   │
│   ├── js/
│   │   ├── main.js                 # Core application logic
│   │   ├── validate.js             # Form validation scripts
│   │   ├── bootstrap.min.js
│   │   ├── jquery-3.3.1.min.js
│   │   └── ...
│   │
│   ├── img/
│   │   ├── icon/                   # Icon assets
│   │   ├── shop-details/           # Product images
│   │   └── ...
│   │
│   ├── fonts/                      # Font files
│   └── lib/                        # External libraries
│       ├── owlcarousel/
│       ├── tempusdominus/
│       └── ...
│
├── assets/                         # Project documentation assets
│   ├── home.png                    # Screenshots for README
│   ├── shop.png
│   ├── cart.png
│   ├── productPage.png
│   └── adminDashboard.png
│
└── README.md                       # This file
```

### Architecture Layers

1. **Presentation Layer** (`views/`, `public/`)
   - EJS templates for server-side rendering
   - Bootstrap + SCSS for responsive UI
   - jQuery for client-side interactivity

2. **Routing Layer** (`routes/`)
   - RESTful route definitions
   - Request routing to controllers
   - Middleware attachment (auth, validation)

3. **Business Logic** (`controllers/`)
   - Request handling and validation
   - Business rule implementation
   - Response formatting

4. **Data Access** (`models/`)
   - Mongoose schema definitions
   - Database query abstraction
   - Data validation rules

5. **Configuration** (`config/`)
   - External service initialization
   - Environment-specific settings
   - Credentials management

---

## 📖 API Usage & Integration Guide

### User Authentication Endpoints

```http
POST /user/register
Content-Type: application/json

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "password": "SecurePassword123"
}

Response: 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

### Product Browsing

```http
GET /shop?category=electronics&page=1&limit=12
GET /product/:productId
GET /search?q=laptop

Response: 200 OK
{
  "products": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Premium Laptop",
      "price": 49999,
      "category": "electronics",
      "rating": 4.5,
      "images": ["url1", "url2"]
    }
  ],
  "totalPages": 5,
  "currentPage": 1
}
```

### Shopping Cart Operations

```http
POST /cart/add
Content-Type: application/json

{
  "productId": "507f1f77bcf86cd799439012",
  "quantity": 2
}

Response: 200 OK
{
  "success": true,
  "cartTotal": 99998,
  "itemCount": 2
}
```

### Payment Processing

```http
POST /payment/razorpay
Content-Type: application/json

{
  "orderId": "ORD123456",
  "amount": 99998,
  "currency": "INR"
}

Response: 200 OK
{
  "razorpayOrderId": "order_xxx",
  "amount": 99998,
  "currency": "INR"
}
```

---

## 🔒 Security Considerations

### Authentication Security
- ✅ Passwords hashed with bcrypt (12 salt rounds minimum)
- ✅ OAuth 2.0 for social authentication
- ✅ Session hijacking prevention via secure session store
- ✅ CSRF protection on state-changing endpoints
- ✅ HTTP-only cookies for session tokens

### API Security
- ✅ Input validation on all endpoints
- ✅ Rate limiting recommended for production
- ✅ CORS configuration for API access control
- ✅ Request sanitization against XSS attacks
- ✅ SQL injection prevention (using Mongoose ODM)

### Data Protection
- ✅ Sensitive data encrypted in transit (HTTPS recommended)
- ✅ Environment variables for secrets (never hardcoded)
- ✅ Payment data handled via Razorpay (PCI-DSS compliant)
- ✅ User passwords never logged or displayed
- ✅ Audit trail for admin operations

### Production Deployment Security
```javascript
// Recommended security headers
app.use(helmet()); // Security headers
app.use(mongoSanitize()); // Data sanitization
app.use(rateLimit()); // Rate limiting
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS,
  credentials: true
}));
```

---

## ⚡ Performance Optimization

### Database Optimization
- **Indexes**: Strategic indexing on frequently queried fields (email, category, price)
- **Query Optimization**: Lean queries to exclude unnecessary fields
- **Pagination**: Implemented for product listings and order history
- **Connection Pooling**: Mongoose connection pool (default: 5-10)

### Caching Strategies
```javascript
// Redis-ready structure for future implementation
// Cache product listings (5 minute TTL)
// Cache category filters (10 minute TTL)
// Cache user cart (session-based)
```

### Image Optimization
- **Cloudinary Integration**: Automatic image resizing, optimization, CDN delivery
- **Sharp Processing**: Server-side image compression before upload
- **Responsive Images**: Multiple sizes served based on device

### Frontend Performance
- **Bootstrap Min CSS/JS**: Minified assets for faster loading
- **Lazy Loading**: Product images load on demand
- **Efficient jQuery**: Delegated event handling for dynamic content
- **Compression**: Gzip compression recommended in production

### Scalability Considerations
- **Stateless Design**: Controllers don't maintain state
- **MongoDB Indexing**: Optimized for query performance
- **Session Store**: MongoDB for distributed session management
- **CDN Ready**: Cloudinary for static asset delivery

---

## 🚀 Deployment Guide

### Environment Preparation

1. **Production Variables** (.env.production)
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/zoocart
SESSION_SECRET=production_secret_key_min_32_chars
```

2. **Server Requirements**
   - Node.js v14+ on Ubuntu 20.04 LTS or similar
   - MongoDB Atlas or self-managed MongoDB 4.4+
   - Nginx as reverse proxy (recommended)
   - SSL/TLS certificate (Let's Encrypt)

3. **Deployment Steps**

```bash
# 1. Clone repository
git clone https://github.com/user/ZooCart-project.git
cd ZooCart-project

# 2. Install dependencies
npm install --production

# 3. Set environment variables
nano .env  # or use environment manager

# 4. Run database migrations (if applicable)
npm run migrate

# 5. Start application with PM2
npm install -g pm2
pm2 start app.js --name "zoocart" --instances max

# 6. Monitor application
pm2 logs zoocart
```

### Nginx Configuration (Reverse Proxy)
```nginx
upstream zoocart_backend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name zoocart.com;
    
    ssl_certificate /etc/letsencrypt/live/zoocart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zoocart.com/privkey.pem;
    
    location / {
        proxy_pass http://zoocart_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

**Issue**: MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**:
- Ensure MongoDB is running: `mongod`
- Verify MONGODB_URI in .env file
- Check MongoDB Atlas network access settings

**Issue**: Cloudinary Upload Fails
```
Error: Authentication failed
```
**Solution**:
- Verify CLOUDINARY_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- Check Cloudinary account permissions
- Ensure image file size < 100MB

**Issue**: Razorpay Payment Webhook Not Firing
```
Webhook not received for payment status update
```
**Solution**:
- Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are correct
- Check webhook URL configuration in Razorpay dashboard
- Ensure server is publicly accessible for webhooks

**Issue**: Session Lost After Server Restart
```
User logged out unexpectedly
```
**Solution**:
- Verify connect-mongo is properly configured
- Check MONGODB_URI connection for session store
- Session data persists in MongoDB, check collection

**Issue**: Email Not Sending
```
Error: getaddrinfo ENOTFOUND smtp.gmail.com
```
**Solution**:
- Enable "Less secure app access" in Gmail (or use App Password)
- Verify EMAIL_USER and EMAIL_PASS in .env
- Check firewall/ISP blocking SMTP port 587

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] **User Registration**: Test with valid/invalid email formats
- [ ] **OAuth Login**: Verify Google authentication flow
- [ ] **Product Search**: Test search and filter functionality
- [ ] **Cart Operations**: Add/remove/update quantity
- [ ] **Checkout Flow**: Verify address selection and order creation
- [ ] **Payment**: Test Razorpay payment success/failure scenarios
- [ ] **Admin Dashboard**: Verify analytics and reporting
- [ ] **Image Upload**: Test with various image formats and sizes
- [ ] **Email Notifications**: Verify order confirmation emails

### Automated Testing (Recommended)
```bash
# Install testing framework
npm install --save-dev jest supertest

# Run tests
npm test

# Coverage report
npm run test:coverage
```

### Load Testing
```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 http://localhost:3000/

# Using Artillery
npm install -g artillery
artillery quick --count 10 --num 100 http://localhost:3000/
```

---

## 📚 Documentation

### Code Documentation
- API endpoints documented with request/response examples
- Schema documentation with field descriptions
- Controller methods documented with JSDoc comments
- Configuration files documented inline

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Cloudinary Documentation](https://cloudinary.com/documentation/)

---

## 🤝 Contributing

### Development Workflow

1. **Fork the Repository**
   ```bash
   git clone https://github.com/yourusername/ZooCart-project.git
   cd ZooCart-project
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   # or for bug fixes
   git checkout -b bugfix/issue-description
   ```

3. **Make Changes**
   - Follow existing code style and conventions
   - Write clear, descriptive commit messages
   - Keep commits atomic and focused
   - Test changes thoroughly

4. **Commit & Push**
   ```bash
   git add .
   git commit -m "feat: Add amazing feature"
   git push origin feature/amazing-feature
   ```

5. **Create Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Include before/after screenshots for UI changes
   - Ensure CI/CD tests pass

### Code Style Guidelines
- **JavaScript**: Use ES6+ syntax
- **Naming**: camelCase for variables/functions, PascalCase for classes/models
- **Comments**: Write meaningful comments for complex logic
- **Error Handling**: Use try-catch blocks with proper logging
- **Security**: Never hardcode sensitive data, always use environment variables

### Commit Message Convention
```
<type>(<scope>): <subject>

<body>

<footer>

# Types: feat, fix, docs, style, refactor, perf, test, chore
# Example: feat(auth): Add Google OAuth integration
```

---

## 📄 License

This project is licensed under the **ISC License** - see the [LICENSE](LICENSE) file for details.

### License Terms
- ✅ Commercial use permitted
- ✅ Modification permitted
- ✅ Distribution permitted
- ✅ Private use permitted
- ⚠️ Liability limited to the extent permitted by law

---

## 👨‍💻 Author & Contributors

**Sarath** - Project Creator & Lead Developer

### How to Contribute
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/yourusername/ZooCart-project/issues).

---

## 📞 Support & Communication

### Getting Help
- 📧 Email: support@zoocart.com
- 🐛 Bug Reports: [GitHub Issues](https://github.com/yourusername/ZooCart-project/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/ZooCart-project/discussions)
- 📖 Documentation: [Wiki](https://github.com/yourusername/ZooCart-project/wiki)

### Community
- Follow [@ZooCart](https://twitter.com/zoocart) on Twitter for updates
- Join our Discord community for discussions
- Check blog posts for tutorials and best practices

---

## 🎉 Acknowledgments & Credits

### Open Source Libraries
- **Express.js** - Fast, unopinionated web framework
- **MongoDB** - Flexible document database
- **Mongoose** - Elegant MongoDB ODM
- **Bootstrap** - Responsive CSS framework
- **jQuery** - DOM manipulation library

### Services
- **Razorpay** - Secure payment gateway
- **Cloudinary** - Cloud image management
- **Nodemailer** - Email delivery service
- **MongoDB Atlas** - Cloud database hosting

### Inspiration
- Modern e-commerce platforms for UX/UI patterns
- Open-source community for best practices
- Tech community for feedback and support

---

## 🔄 Version History

### v1.0.0 (Current Release - May 2026)
- ✅ Core e-commerce functionality
- ✅ User authentication (local + OAuth)
- ✅ Product catalog with search & filters
- ✅ Shopping cart & checkout
- ✅ Razorpay payment integration
- ✅ Admin dashboard with analytics
- ✅ Order tracking & management
- ✅ Email notifications

### Future Roadmap
- 🔜 Mobile app (React Native)
- 🔜 Advanced analytics & AI recommendations
- 🔜 Inventory management system
- 🔜 Multi-vendor support
- 🔜 Customer reviews & ratings
- 🔜 Social integration (Instagram shopping)
- 🔜 Subscription/recurring orders

---

## ⭐ Stargazers

If this project helped you, please consider giving it a star! It helps us grow and improve.

[![Star](https://img.shields.io/github/stars/yourusername/ZooCart-project?style=social)](https://github.com/yourusername/ZooCart-project)

---

## 📊 Project Statistics

- **Lines of Code**: ~10,000+
- **Models**: 13
- **Controllers**: 15+
- **API Endpoints**: 50+
- **Dependencies**: 19
- **Database Collections**: 13

---

**Built with ❤️ by the ZooCart Team**

**Last Updated**: May 7, 2026

**Repository**: [github.com/yourusername/ZooCart-project](https://github.com/yourusername/ZooCart-project)

**Live Demo**: [zoocart.example.com](https://zoocart.example.com)
