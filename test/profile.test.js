const request = require('supertest');
const { app, server, io } = require('../index');
const mongoose = require('mongoose');
const path = require('path');

const User = require('../models/User');

let token;
let userId;
let testUserFullName = 'Profile Test User';
let testUserEmail = 'profiletestuser@example.com';
let otherUserEmail = 'otherprofileuser@example.com';
let otherUserId;

jest.mock('../middlewares/fileupload', () => {
    const path = require('path');

    const multerMock = {
        single: jest.fn((fieldName) => (req, res, next) => {
            req.file = {
                fieldname: fieldName,
                originalname: 'mock-image.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                size: 1024,
                destination: '/tmp/uploads',
                filename: `mock-${Date.now()}-${fieldName}.jpg`,
                path: `/uploads/mock-${Date.now()}-${fieldName}.jpg`.replace(/\//g, path.sep),
            };
            next();
        }),
        none: jest.fn(() => (req, res, next) => { next(); }),
        array: jest.fn(() => (req, res, next) => { req.files = []; next(); }),
        fields: jest.fn(() => (req, res, next) => { req.files = {}; next(); }),
    };
    return multerMock;
});

beforeAll(async () => {
    await User.deleteMany({ email: testUserEmail });
    await User.deleteMany({ email: otherUserEmail });
    console.log('--- beforeAll (Profile Tests): Cleaned up previous test data ---');

    const registerRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: testUserFullName,
            email: testUserEmail,
            password: 'ProfileSecurePass123!',
            phone: '9988776655',
            address: '123 Main St',
        });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
            email: testUserEmail,
            password: 'ProfileSecurePass123!',
        });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token;

    const user = await User.findOne({ email: testUserEmail });
    expect(user).not.toBeNull();
    userId = user._id;
    console.log(`--- beforeAll (Profile Tests): Main user ${testUserEmail} created and logged in ---`);

    const otherUserRegisterRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: 'Other Profile User',
            email: otherUserEmail,
            password: 'OtherSecurePass123!',
            phone: '1122334455',
            address: '456 Other St',
        });
    expect(otherUserRegisterRes.statusCode).toBe(201);
    const otherUser = await User.findOne({ email: otherUserEmail });
    otherUserId = otherUser._id;
    console.log(`--- beforeAll (Profile Tests): Other user ${otherUserEmail} created ---`);
});

afterAll(async () => {
    await User.deleteMany({ email: testUserEmail });
    await User.deleteMany({ email: otherUserEmail });
    console.log('--- afterAll (Profile Tests): Cleaned up all test data ---');

    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Profile Tests): MongoDB connection closed cleanly ---');
    }

    if (server && server.listening) {
        if (io) {
            io.close();
            console.log('--- afterAll (Profile Tests): Socket.IO connections closed ---');
        }
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (Profile Tests): Express server closed cleanly ---');
    }
});


describe('User Profile Operations', () => {

    describe('GET /api/user/profile', () => {
        beforeEach(async () => {
            await User.deleteMany({ email: testUserEmail });

            await request(server).post('/api/auth/register').send({
                fullName: testUserFullName,
                email: testUserEmail,
                password: 'ProfileSecurePass123!',
                phone: '9988776655',
                address: '123 Main St',
            });
            const user = await User.findOne({ email: testUserEmail });
            userId = user._id;

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
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id', userId.toString());
            expect(res.body.data).toHaveProperty('fullName', testUserFullName);
            expect(res.body.data).toHaveProperty('email', testUserEmail);
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('should return 401 for unauthenticated access to user profile', async () => {
            const res = await request(server)
                .get('/api/user/profile');

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized|no token/i);
        });

        it('should return 401 if authenticated user is not found (edge case)', async () => {
            const tempToken = token;

            await User.findByIdAndDelete(userId);

            const res = await request(server)
                .get('/api/user/profile')
                .set('Authorization', `Bearer ${tempToken}`);

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized|invalid token|Authentication failed: User associated with this token no longer exists./i);
        });
    });

    describe('PUT /api/user/profile', () => {
        beforeEach(async () => {
            await User.deleteMany({ email: testUserEmail });
            await User.deleteMany({ email: otherUserEmail });

            await request(server).post('/api/auth/register').send({
                fullName: testUserFullName,
                email: testUserEmail,
                password: 'ProfileSecurePass123!',
                phone: '9988776655',
                address: '123 Main St',
            });
            const recreatedUser = await User.findOne({ email: testUserEmail });
            userId = recreatedUser._id;

            await request(server).post('/api/auth/register').send({
                fullName: 'Other Profile User',
                email: otherUserEmail,
                password: 'OtherSecurePass123!',
                phone: '1122334455',
                address: '456 Other St',
            });
            const otherRecreatedUser = await User.findOne({ email: otherUserEmail });
            otherUserId = otherRecreatedUser._id;

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
                    address: '',
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('address', '');

            const userInDb = await User.findById(userId);
            expect(userInDb.address).toBe('');
        });


        it('should update user profile picture successfully', async () => {
            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Profile updated successfully.');
            expect(res.body.data).toHaveProperty('profilePicture');
            expect(res.body.data.profilePicture).toMatch(/\/uploads\/mock-.*-profilePicture\.jpg$/);

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
            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    email: otherUserEmail,
                });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email address is already in use.');

            const userInDb = await User.findById(userId);
            expect(userInDb.email).toBe(testUserEmail);
        });

        it('should return 401 if authenticated user is not found during update (edge case)', async () => {
            const tempToken = token;

            await User.findByIdAndDelete(userId);

            const res = await request(server)
                .put('/api/user/profile')
                .set('Authorization', `Bearer ${tempToken}`)
                .send({ fullName: 'Deleted User Name' });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized|invalid token|Authentication failed: User associated with this token no longer exists./i);
        });
    });
});