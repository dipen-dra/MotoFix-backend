// test/profile.test.js

const request = require('supertest');
const { app, server, io } = require('../index'); // Import the server instance
const mongoose = require('mongoose');
const path = require('path'); // For path.sep in mock path

const User = require('../models/User');

// --- Global Test Variables ---
let token; // Stores the JWT token for authenticated requests
let userId; // Stores the ID of the main test user
let testUserFullName = 'Profile Test User';
let testUserEmail = 'profiletestuser@example.com';
let otherUserEmail = 'otherprofileuser@example.com';
let otherUserId; // Stores the ID of a secondary user for duplicate email tests

// --- Mocking Multer for File Uploads ---
// This mock intercepts calls to `upload.single('profilePicture')` and
// simulates `req.file` being attached, without actual file system interaction.
jest.mock('../middlewares/fileupload', () => {
    // Require 'path' inside the mock factory to satisfy Jest's scoping rules
    const path = require('path');

    const multerMock = {
        single: jest.fn((fieldName) => (req, res, next) => {
            // Simulate the `req.file` object structure that multer would normally provide
            req.file = {
                fieldname: fieldName,
                originalname: 'mock-image.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                destination: '/tmp/uploads', // Dummy destination
                filename: `mock-${Date.now()}-${fieldName}.jpg`,
                // Use path.sep for cross-platform compatibility in the simulated path
                path: `/uploads/mock-${Date.now()}-${fieldName}.jpg`.replace(/\//g, path.sep),
            };
            next(); // Crucial: Call next to pass control to the actual controller
        }),
        // Add mocks for other multer methods if your routes use them (e.g., .array(), .fields(), .none())
        none: jest.fn(() => (req, res, next) => { next(); }),
        array: jest.fn(() => (req, res, next) => { req.files = []; next(); }),
        fields: jest.fn(() => (req, res, next) => { req.files = {}; next(); }),
    };
    return multerMock;
});

beforeAll(async () => {
    // --- Database Cleanup ---
    // Ensure a clean state before all tests in this suite run
    await User.deleteMany({ email: testUserEmail });
    await User.deleteMany({ email: otherUserEmail });
    console.log('--- beforeAll (Profile Tests): Cleaned up previous test data ---');

    // --- Register the main test user ---
    const registerRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: testUserFullName,
            email: testUserEmail,
            password: 'ProfileSecurePass123!', // Strong password for registration
            phone: '9988776655',
            address: '123 Main St',
        });
    expect(registerRes.statusCode).toBe(201); // Assert successful registration

    // --- Login to get JWT token and user ID ---
    const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
            email: testUserEmail,
            password: 'ProfileSecurePass123!',
        });
    expect(loginRes.statusCode).toBe(200); // Assert successful login
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token; // Store the valid token

    // Fetch the user from DB to get their actual ID
    const user = await User.findOne({ email: testUserEmail });
    expect(user).not.toBeNull(); // Ensure user was found
    userId = user._id; // Store the user's ID
    console.log(`--- beforeAll (Profile Tests): Main user ${testUserEmail} created and logged in ---`);

    // --- Create another user for duplicate email test scenario ---
    const otherUserRegisterRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: 'Other Profile User',
            email: otherUserEmail,
            password: 'OtherSecurePass123!',
            phone: '1122334455',
            address: '456 Other St',
        });
    expect(otherUserRegisterRes.statusCode).toBe(201); // Assert registration success
    const otherUser = await User.findOne({ email: otherUserEmail });
    otherUserId = otherUser._id; // Store the other user's ID
    console.log(`--- beforeAll (Profile Tests): Other user ${otherUserEmail} created ---`);
});

afterAll(async () => {
    // --- Database Cleanup after all tests in this suite ---
    await User.deleteMany({ email: testUserEmail });
    await User.deleteMany({ email: otherUserEmail });
    console.log('--- afterAll (Profile Tests): Cleaned up all test data ---');

    // --- Close Mongoose connection cleanly ---
    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Profile Tests): MongoDB connection closed cleanly ---');
    }

    // --- Close the HTTP server and Socket.IO connections ---
    // Crucial for preventing 'TCPSERVERWRAP' open handle warning from Jest
    if (server && server.listening) {
        if (io) {
            io.close(); // Close Socket.IO connections
            console.log('--- afterAll (Profile Tests): Socket.IO connections closed ---');
        }
        await new Promise(resolve => server.close(resolve)); // Close the HTTP server
        console.log('--- afterAll (Profile Tests): Express server closed cleanly ---');
    }
});


describe('User Profile Operations', () => {

    // --- GET /api/user/profile tests ---
    describe('GET /api/user/profile', () => {
        // beforeEach hook to ensure a fresh user/token state for GET tests
        beforeEach(async () => {
            // Clean up any user that might have been left from a previous test's edge case
            await User.deleteMany({ email: testUserEmail });

            // Re-register the main test user
            await request(server).post('/api/auth/register').send({
                fullName: testUserFullName,
                email: testUserEmail,
                password: 'ProfileSecurePass123!',
                phone: '9988776655',
                address: '123 Main St',
            });
            const user = await User.findOne({ email: testUserEmail });
            userId = user._id;

            // Log in again to get a fresh token for this `describe` block's tests
            const loginRes = await request(server).post('/api/auth/login').send({
                email: testUserEmail,
                password: 'ProfileSecurePass123!',
            });
            token = loginRes.body.token;
            console.log(`--- beforeEach (GET Profile): User ${testUserEmail} recreated and logged in. ---`);
        });

        it('should return the user profile for an authenticated user', async () => {
            const res = await request(server)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${token}`); // Use the valid token

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id', userId.toString());
            expect(res.body.data).toHaveProperty('fullName', testUserFullName);
            expect(res.body.data).toHaveProperty('email', testUserEmail);
            expect(res.body.data).not.toHaveProperty('password'); // Ensure password hash is NOT returned
        });

        it('should return 401 for unauthenticated access to user profile', async () => {
            const res = await request(server)
                .get('/api/user/profile'); // No Authorization header

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized|no token/i); // Assert expected error message
        });

        // Edge case: Authenticated request, but user no longer exists in DB
        it('should return 401 if authenticated user is not found (edge case)', async () => {
            const tempToken = token; // Store current token

            await User.findByIdAndDelete(userId); // Delete the user from DB (this invalidates tempToken)

            const res = await request(server)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${tempToken}`); // Request with token of a deleted user

            expect(res.statusCode).toBe(401); // Expect 401 as user associated with token is gone
            expect(res.body.success).toBe(false);
            // Updated regex to include the specific error message from your middleware
            expect(res.body.message).toMatch(/not authorized|invalid token|Authentication failed: User associated with this token no longer exists./i); // <--- FIX HERE

            // --- CRITICAL RECOVERY FOR SUBSEQUENT TESTS ---
            // No need for recreation/re-login here, as the `beforeEach` will handle it for the *next* test
        });
    });

    // --- PUT /api/user/profile tests ---
    describe('PUT /api/user/profile', () => {
        // beforeEach hook to ensure user state is clean before each PUT test
        beforeEach(async () => {
            // Clean up any user that might have been left from previous tests or their edge cases
            await User.deleteMany({ email: testUserEmail });
            await User.deleteMany({ email: otherUserEmail }); // Ensure other user is clean too if recreated/modified

            // Recreate the main test user
            await request(server).post('/api/auth/register').send({
                fullName: testUserFullName,
                email: testUserEmail,
                password: 'ProfileSecurePass123!',
                phone: '9988776655',
                address: '123 Main St',
            });
            const recreatedUser = await User.findOne({ email: testUserEmail });
            userId = recreatedUser._id;

            // Recreate the other user for duplicate email tests
            await request(server).post('/api/auth/register').send({
                fullName: 'Other Profile User',
                email: otherUserEmail,
                password: 'OtherSecurePass123!',
                phone: '1122334455',
                address: '456 Other St',
            });
            const otherRecreatedUser = await User.findOne({ email: otherUserEmail });
            otherUserId = otherRecreatedUser._id;

            // Get a fresh token for this `describe` block's tests
            const newLoginRes = await request(server).post('/api/auth/login').send({
                email: testUserEmail,
                password: 'ProfileSecurePass123!',
            });
            expect(newLoginRes.statusCode).toBe(200);
            token = newLoginRes.body.token;
            console.log(`--- beforeEach (PUT Profile): User ${testUserEmail} recreated and logged in. ---`);
        });


        it('should update user profile text fields successfully', async () => {
            const updatedFullName = 'New Full Name Updated';
            const updatedPhone = '9876543210';
            const updatedAddress = '456 New Address Updated';

            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    fullName: updatedFullName,
                    phone: updatedPhone,
                    address: updatedAddress,
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Profile updated successfully.');
            expect(res.body.data).toHaveProperty('fullName', updatedFullName);
            expect(res.body.data).toHaveProperty('phone', updatedPhone);
            expect(res.body.data).toHaveProperty('address', updatedAddress);
            expect(res.body.data).not.toHaveProperty('password');

            // Verify the changes persisted in the database
            const userInDb = await User.findById(userId);
            expect(userInDb.fullName).toBe(updatedFullName);
            expect(userInDb.phone).toBe(updatedPhone);
            expect(userInDb.address).toBe(updatedAddress);
        });

        it('should allow setting address to an empty string', async () => {
            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    address: '', // Explicitly setting to an empty string
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('address', '');

            // Verify the change in the database
            const userInDb = await User.findById(userId);
            expect(userInDb.address).toBe('');
        });


        it('should update user profile picture successfully', async () => {
            // Since `multer` is mocked, we don't send actual file data via .attach().
            // The mock middleware directly injects `req.file` into the request.
            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({ /* no file data needed here, mock handles it */ });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Profile updated successfully.');
            expect(res.body.data).toHaveProperty('profilePicture');
            // Assert the format of the path created by the mock
            expect(res.body.data.profilePicture).toMatch(/\/uploads\/mock-.*-profilePicture\.jpg$/);

            // Verify the change in the database
            const userInDb = await User.findById(userId);
            expect(userInDb.profilePicture).toMatch(/\/uploads\/mock-.*-profilePicture\.jpg$/);
        });

        it('should return 401 for unauthenticated access to update profile', async () => {
            const res = await request(server)
                .put('/api/user/profile')
                .send({ fullName: 'Unauthorized Name Change' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized|no token/i);
        });

        it('should return 400 for duplicate email when updating profile', async () => {
            // Attempt to update the main user's email to another existing user's email
            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: otherUserEmail, // This email is already taken by 'otherprofileuser@example.com'
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email address is already in use.');

            // Verify the email was NOT changed in the database
            const userInDb = await User.findById(userId);
            expect(userInDb.email).toBe(testUserEmail); // Should still be the original email
        });

        // Edge case: Authenticated request, but user no longer exists in DB during update
        it('should return 401 if authenticated user is not found during update (edge case)', async () => {
            const tempToken = token; // Store current token

            await User.findByIdAndDelete(userId); // Delete the user from DB

            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${tempToken}`) // Request with token of a deleted user
                .send({ fullName: 'Deleted User Name' });

            expect(res.statusCode).toBe(401); // <--- EXPECTATION IS 401
            expect(res.body.success).toBe(false);
            // Updated regex to include the specific error message from your middleware
            expect(res.body.message).toMatch(/not authorized|invalid token|Authentication failed: User associated with this token no longer exists./i); // <--- FIX HERE

            // No need for explicit recreation here, the `beforeEach` will handle it for the next test
        });
    });
});