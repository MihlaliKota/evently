const dashboardModel = require('../models/dashboardModel');
const asyncHandler = require('../utils/asyncHandler');

const dashboardController = {
  // Get dashboard stats
  getStats: asyncHandler(async (req, res) => {
    const stats = await dashboardModel.getStats();
    res.status(200).json(stats);
  })
};

module.exports = dashboardController;