const Product = require('../models/Product');

function parsePositiveInteger(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return max ? Math.min(parsed, max) : parsed;
}

function buildProductFilter(query) {
  const filter = {};

  if (query.category) {
    filter.category = query.category.toLowerCase();
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  if (query.minStock || query.maxStock) {
    filter.quantity = {};
    if (query.minStock) filter.quantity.$gte = Number(query.minStock);
    if (query.maxStock) filter.quantity.$lte = Number(query.maxStock);
  }

  return filter;
}

function buildSort(sortQuery) {
  if (!sortQuery) {
    return '-createdAt';
  }

  return sortQuery.split(',').join(' ');
}

function validateQuantity(quantity) {
  const value = Number(quantity);

  if (!Number.isInteger(value) || value <= 0) {
    const error = new Error('Quantity must be a positive integer');
    error.statusCode = 400;
    throw error;
  }

  return value;
}

async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const page = parsePositiveInteger(req.query.page, 1);
    const limit = parsePositiveInteger(req.query.limit, 10, 100);
    const skip = (page - 1) * limit;
    const filter = buildProductFilter(req.query);
    const sort = buildSort(req.query.sort);

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      count: products.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function restockProduct(req, res, next) {
  try {
    const quantity = validateQuantity(req.body.quantity);
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { quantity } },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: `Stock increased by ${quantity}`,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function recordSale(req, res, next) {
  try {
    const quantity = validateQuantity(req.body.quantity);
    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        quantity: { $gte: quantity }
      },
      { $inc: { quantity: -quantity } },
      { new: true, runValidators: true }
    );

    if (!product) {
      const existingProduct = await Product.findById(req.params.id);

      return res.status(existingProduct ? 400 : 404).json({
        success: false,
        message: existingProduct ? 'Insufficient stock for sale' : 'Product not found'
      });
    }

    res.json({
      success: true,
      message: `Stock decreased by ${quantity}`,
      data: product
    });
  } catch (error) {
    next(error);
  }
}

async function getLowStockReport(req, res, next) {
  try {
    const threshold = req.query.threshold ? Number(req.query.threshold) : null;
    const matchStage = threshold === null
      ? { $expr: { $lte: ['$quantity', '$reorderLevel'] } }
      : { quantity: { $lte: threshold } };

    if (threshold !== null && (Number.isNaN(threshold) || threshold < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Threshold must be a non-negative number'
      });
    }

    const report = await Product.aggregate([
      { $match: { isActive: true, ...matchStage } },
      {
        $project: {
          name: 1,
          sku: 1,
          category: 1,
          quantity: 1,
          reorderLevel: 1,
          shortage: { $max: [{ $subtract: ['$reorderLevel', '$quantity'] }, 0] },
          inventoryValue: { $multiply: ['$price', '$quantity'] }
        }
      },
      { $sort: { quantity: 1, name: 1 } }
    ]);

    res.json({
      success: true,
      count: report.length,
      data: report
    });
  } catch (error) {
    next(error);
  }
}

async function getCategorySummary(req, res, next) {
  try {
    const summary = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalInventoryValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          averagePrice: { $avg: '$price' },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ['$quantity', '$reorderLevel'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          totalProducts: 1,
          totalQuantity: 1,
          totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
          averagePrice: { $round: ['$averagePrice', 2] },
          lowStockItems: 1
        }
      },
      { $sort: { category: 1 } }
    ]);

    res.json({
      success: true,
      count: summary.length,
      data: summary
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restockProduct,
  recordSale,
  getLowStockReport,
  getCategorySummary
};
