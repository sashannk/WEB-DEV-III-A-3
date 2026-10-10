const mongoose = require('mongoose');

function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid product id'
    });
  }

  next();
}

module.exports = validateObjectId;
