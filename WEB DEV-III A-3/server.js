const dotenv = require('dotenv');
const express = require('express');

const connectDB = require('./src/config/db');
const productRoutes = require('./src/routes/productRoutes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Inventory and Data Management System API',
    endpoints: {
      products: '/api/products',
      lowStockReport: '/api/products/reports/low-stock',
      categorySummary: '/api/products/reports/category-summary'
    }
  });
});

app.use('/api/products', productRoutes);
app.use(notFound);
app.use(errorHandler);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  });
