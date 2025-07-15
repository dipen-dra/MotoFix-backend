const request = require('supertest');
const { app, server, io } = require('../index');
const mongoose = require('mongoose');

const User = require('../models/User');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

let token;
let userId;
let testServiceId;
let testUserFullName = 'Dash Test User';

beforeAll(async () => {
    await User.deleteMany({ email: 'dashuser@gmail.com' });
    await Booking.deleteMany({});
    await Service.deleteMany({ name: 'Test Dashboard Service' });
    console.log('--- beforeAll: Cleaned up previous test data ---');

    const testService = await Service.create({
        name: 'Test Dashboard Service',
        description: 'Service for dashboard tests',
        price: 500,
        duration: 60,
        availability: true,
        image: 'https://example.com/test-service-image.jpg',
    });
    testServiceId = testService._id;
    console.log('--- beforeAll: Created test service ---');

    const registerRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: testUserFullName,
            email: 'dashuser@gmail.com',
            password: 'SecurePassword123!',
            phone: '9876543210',
            address: '123 Test St',
        });

    console.log('--- beforeAll: registerRes.statusCode:', registerRes.statusCode);
    console.log('--- beforeAll: registerRes.body:', registerRes.body);

    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.body.success).toBe(true);
    console.log(`--- beforeAll: User registration status: ${registerRes.statusCode} ---`);

    const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
            email: 'dashuser@gmail.com',
            password: 'SecurePassword123!',
        });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.token).toBeDefined();
    token = loginRes.body.token;
    console.log(`--- beforeAll: User login status: ${loginRes.statusCode} ---`);

    const user = await User.findOne({ email: 'dashuser@gmail.com' });

    expect(user).not.toBeNull();
    userId = user._id;
    console.log(`--- beforeAll: Found user with ID: ${userId} ---`);

    user.loyaltyPoints = 150;
    await user.save();
    console.log(`--- beforeAll: Set loyalty points for user ${user.email} to ${user.loyaltyPoints} ---`);

    await Booking.create([
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Dashboard Service',
            bikeModel: 'Yamaha R15',
            date: new Date(Date.now() + 86400000),
            notes: 'Test booking 1',
            totalCost: 500,
            finalAmount: 500,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Dashboard Service',
            bikeModel: 'Suzuki Gixxer',
            date: new Date(Date.now() + 172800000),
            notes: 'Test booking 2',
            totalCost: 500,
            finalAmount: 500,
            status: 'In Progress',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Dashboard Service',
            bikeModel: 'Bajaj Pulsar',
            date: new Date(Date.now() - 86400000),
            notes: 'Test booking 3',
            totalCost: 500,
            finalAmount: 500,
            status: 'Completed',
            paymentStatus: 'Paid',
            isPaid: true,
        },
    ]);
    console.log('--- beforeAll: Created test bookings ---');
});

afterAll(async () => {
    await Booking.deleteMany({});
    await User.deleteOne({ email: 'dashuser@gmail.com' });
    await Service.deleteMany({ name: 'Test Dashboard Service' });
    console.log('--- afterAll: Cleaned up test data ---');

    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll: MongoDB connection closed cleanly ---');
    }

    if (server && server.listening) {
        if (io) {
            io.close();
            console.log('--- afterAll: Socket.IO connections closed ---');
        }
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll: Express server closed cleanly ---');
    }
});


describe('GET /api/user/dashboard-summary', () => {
    it('should return booking stats and loyalty points for authenticated user', async () => {
        const res = await request(server)
            .get('/api/user/dashboard-summary')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('loyaltyPoints', 150);
        expect(res.body.data).toHaveProperty('upcomingBookings', 2);
        expect(res.body.data).toHaveProperty('completedServices', 1);
        expect(res.body.data).toHaveProperty('recentBookings');
        expect(res.body.data.recentBookings.length).toBe(3);
    });

    it('should return 401 for unauthenticated request', async () => {
        const res = await request(server).get('/api/user/dashboard-summary');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/not authorized|no token|invalid token/i);
    });
});