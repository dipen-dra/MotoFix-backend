// const express = require('express');
// const router = express.Router();

// const { getDashboardSummary } = require('../../controllers/user/dashboardController');
// const authorizedUser = require('../../middlewares/authorizedUser');

// // This line requires 'getDashboardSummary' to be a function.
// // If it's undefined, the server will crash with the error you are seeing.
// console.log('getDashboardSummary:', getDashboardSummary);
// // @route   GET /api/user/dashboard-summary
// // @desc    Get user dashboard summary
// router.get('/dashboard-summary', authorizedUser, getDashboardSummary);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { getDashboardSummary } = require('../../controllers/user/dashboardController');
const { authenticateUser } = require('../../middlewares/authorizedUser');

console.log('authenticateUser loaded:', typeof authenticateUser);
console.log('getDashboardSummary loaded:', typeof getDashboardSummary);

router.get('/dashboard-summary', authenticateUser, getDashboardSummary);

module.exports = router;
// This code sets up a route for fetching the user dashboard summary.
// It uses the `authenticateUser` middleware to ensure the user is authenticated before accessing the dashboard