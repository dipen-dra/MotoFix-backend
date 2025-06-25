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