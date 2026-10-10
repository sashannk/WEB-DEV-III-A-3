# Assignment 3: Inventory and Data Management System

RESTful backend API built with Node.js, Express.js, MongoDB, Mongoose, and dotenv.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example`:

   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory_lab3
   ```

3. Start MongoDB locally, then run:

   ```bash
   npm start
   ```

   For development reloads:

   ```bash
   npm run dev
   ```

## Product Fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | String | Yes | 2-100 characters |
| `sku` | String | Yes | Unique, uppercase letters/numbers/hyphens |
| `category` | String | Yes | `electronics`, `grocery`, `clothing`, `stationery`, `hardware`, `other` |
| `description` | String | No | Up to 500 characters |
| `price` | Number | Yes | Must be 0 or more |
| `quantity` | Number | Yes | Must be 0 or more |
| `reorderLevel` | Number | No | Defaults to 10 |
| `supplier.name` | String | No | Supplier name |
| `supplier.email` | String | No | Valid email format |
| `isActive` | Boolean | No | Defaults to true |

## API Endpoints

### Create Product

```http
POST /api/products
```

Example body:

```json
{
  "name": "Wireless Mouse",
  "sku": "ELEC-MOUSE-001",
  "category": "electronics",
  "description": "Ergonomic wireless mouse",
  "price": 799,
  "quantity": 25,
  "reorderLevel": 8,
  "supplier": {
    "name": "Tech Supplies",
    "email": "sales@techsupplies.com"
  }
}
```

### Get All Products

```http
GET /api/products
```

Supported query parameters:

| Query | Example |
| --- | --- |
| `category` | `/api/products?category=electronics` |
| `isActive` | `/api/products?isActive=true` |
| `search` | `/api/products?search=mouse` |
| `minPrice`, `maxPrice` | `/api/products?minPrice=100&maxPrice=1000` |
| `minStock`, `maxStock` | `/api/products?minStock=1&maxStock=20` |
| `sort` | `/api/products?sort=price,-createdAt` |
| `page`, `limit` | `/api/products?page=2&limit=5` |

### Get Single Product

```http
GET /api/products/:id
```

### Update Product Details

```http
PATCH /api/products/:id
```

Example body:

```json
{
  "price": 749,
  "reorderLevel": 12
}
```

### Delete Product

```http
DELETE /api/products/:id
```

### Restock Product

```http
PATCH /api/products/:id/restock
```

Example body:

```json
{
  "quantity": 10
}
```

### Record Sale

```http
PATCH /api/products/:id/sale
```

Example body:

```json
{
  "quantity": 3
}
```

The sale operation uses an atomic MongoDB update, so stock cannot drop below zero.

### Low-Stock Alert Report

```http
GET /api/products/reports/low-stock
```

By default, this returns products where `quantity <= reorderLevel`.

Optional threshold:

```http
GET /api/products/reports/low-stock?threshold=5
```

### Category-Wise Inventory Summary

```http
GET /api/products/reports/category-summary
```

Returns category totals including product count, total stock quantity, total inventory value, average price, and low-stock item count.
