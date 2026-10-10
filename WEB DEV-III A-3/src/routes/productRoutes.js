const express = require('express');

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restockProduct,
  recordSale,
  getLowStockReport,
  getCategorySummary
} = require('../controllers/productController');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.route('/')
  .post(createProduct)
  .get(getProducts);

router.get('/reports/low-stock', getLowStockReport);
router.get('/reports/category-summary', getCategorySummary);

router.route('/:id')
  .get(validateObjectId, getProductById)
  .patch(validateObjectId, updateProduct)
  .delete(validateObjectId, deleteProduct);

router.patch('/:id/restock', validateObjectId, restockProduct);
router.patch('/:id/sale', validateObjectId, recordSale);

module.exports = router;
