const categoryModel = require('../models/categoryModel');
const asyncHandler = require('../utils/asyncHandler');

const categoryController = {
  // Get all categories
  getAllCategories: asyncHandler(async (req, res) => {
    const categories = await categoryModel.getAll();
    res.status(200).json(categories);
  })
};

module.exports = categoryController;