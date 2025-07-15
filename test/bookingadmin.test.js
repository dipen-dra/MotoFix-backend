const request = require('supertest');
const { app, server, io } = require('../index');
const mongoose = require('mongoose');

const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Workshop = require('../models/Workshop');

jest.mock('../utils/sendEmail');
const sendEmail = require('../utils/sendEmail');
sendEmail.mockImplementation(() => Promise.resolve());

jest.mock('puppeteer', () => ({
    launch: jest.fn(() => ({
        newPage: jest.fn(() => ({
            setContent: jest.fn(() => Promise.resolve()),
            pdf: jest.fn(() => Promise.resolve(Buffer.from('mock PDF content'))),
            close: jest.fn(() => Promise.resolve()),
        })),
        close: jest.fn(() => Promise.resolve()),
    })),
}));
const puppeteer = require('puppeteer');

const mockIo = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    close: jest.fn(),
};

let adminToken;
let adminUserId;
let normalToken;
let normalUserId;
let testServiceId;
let testWorkshopId;

let bookingPendingId;
let bookingInProgressId;
let bookingCompletedPaidId;
let bookingCancelledId;
let bookingAwardedPointsId;
let bookingDiscountedId;
let bookingSearchId;


beforeAll(async () => {
    await User.deleteMany({ $or: [{ email: /@test\.com$/ }, { email: /@example\.com$/ }] });
    await Booking.deleteMany({});
    await Service.deleteMany({ name: 'Admin Test Service' });
    await Workshop.deleteMany({});
    console.log('--- beforeAll (Admin Booking Tests): Cleaned up previous test data ---');

    const workshop = await Workshop.create({
        ownerName: 'Admin Test Owner',
        workshopName: 'Admin Test Workshop',
        email: 'admin.workshop@example.com',
        phone: '9998887777',
        address: 'Admin Workshop Address',
        offerPickupDropoff: true,
        pickupDropoffChargePerKm: 10,
        profilePicture: 'http://example.com/admin-workshop.jpg'
    });
    testWorkshopId = workshop._id;
    console.log('--- beforeAll (Admin Booking Tests): Created test workshop ---');

    const adminRegisterRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: 'Admin User',
            email: 'admin@test.com',
            password: 'AdminSecurePass123!',
            phone: '1234567890',
            address: 'Admin Address',
            role: 'admin'
        });
    expect(adminRegisterRes.statusCode).toBe(201);

    const adminLoginRes = await request(server)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'AdminSecurePass123!' });
    expect(adminLoginRes.statusCode).toBe(200);
    adminToken = adminLoginRes.body.token;
    adminUserId = (await User.findOne({ email: 'admin@test.com' }))._id;
    await User.findByIdAndUpdate(adminUserId, {
        workshopName: workshop.workshopName,
        address: workshop.address,
        phone: workshop.phone
    });
    console.log('--- beforeAll (Admin Booking Tests): Admin user created and logged in ---');

    const normalRegisterRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: 'Normal User',
            email: 'normal@test.com',
            password: 'NormalSecurePass123!',
            phone: '0987654321',
            address: 'Normal Address',
            role: 'normal'
        });
    expect(normalRegisterRes.statusCode).toBe(201);

    const normalLoginRes = await request(server)
        .post('/api/auth/login')
        .send({ email: 'normal@test.com', password: 'NormalSecurePass123!' });
    expect(normalLoginRes.statusCode).toBe(200);
    normalToken = normalLoginRes.body.token;
    const normalUser = await User.findOne({ email: 'normal@test.com' });
    normalUserId = normalUser._id;
    normalUser.loyaltyPoints = 150;
    await normalUser.save();
    console.log('--- beforeAll (Admin Booking Tests): Normal user created and logged in ---');

    const service = await Service.create({
        name: 'Admin Test Service',
        description: 'Service for admin booking tests.',
        price: 500,
        duration: 30,
        availability: true,
        image: 'http://example.com/admin-service.jpg'
    });
    testServiceId = service._id;
    console.log('--- beforeAll (Admin Booking Tests): Test service created ---');

    const bookings = await Booking.create([
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
            bikeModel: 'Honda CBR', date: new Date(Date.now() + 86400000), notes: 'Pending booking',
            totalCost: 500, finalAmount: 500, status: 'Pending', paymentStatus: 'Pending', isPaid: false,
        },
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
            bikeModel: 'Yamaha R1', date: new Date(Date.now() + 2 * 86400000), notes: 'In progress booking',
            totalCost: 500, finalAmount: 500, status: 'In Progress', paymentStatus: 'Pending', isPaid: false,
        },
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
            bikeModel: 'Kawasaki Ninja', date: new Date(Date.now() - 86400000), notes: 'Completed paid booking',
            totalCost: 500, finalAmount: 500, status: 'Completed', paymentStatus: 'Paid', isPaid: true,
        },
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
            bikeModel: 'Suzuki GSX', date: new Date(Date.now() - 2 * 86400000), notes: 'Cancelled booking',
            totalCost: 500, finalAmount: 500, status: 'Cancelled', paymentStatus: 'Pending', isPaid: false, archivedByAdmin: true,
        },
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
            bikeModel: 'Harley Davidson', date: new Date(Date.now() + 3 * 86400000), notes: 'Booking with awarded points',
            totalCost: 700, finalAmount: 700, status: 'Pending', paymentStatus: 'Paid', isPaid: true, pointsAwarded: 15,
        },
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
            bikeModel: 'BMW S1000RR', date: new Date(Date.now() + 4 * 86400000), notes: 'Booking with discount',
            totalCost: 1000, finalAmount: 800, status: 'Pending', paymentStatus: 'Pending', isPaid: false, discountApplied: true, discountAmount: 200,
        },
        {
            customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Specific Search Service',
            bikeModel: 'Specific Search Bike', date: new Date(Date.now() + 1000),
            notes: 'For search test',
            totalCost: 600, finalAmount: 600, status: 'Completed', paymentStatus: 'Paid', isPaid: true,
            pickupAddress: 'Specific Search Pickup Address', dropoffAddress: 'Specific Search Dropoff Address'
        },
    ]);

    bookingPendingId = bookings[0]._id;
    bookingInProgressId = bookings[1]._id;
    bookingCompletedPaidId = bookings[2]._id;
    bookingCancelledId = bookings[3]._id;
    bookingAwardedPointsId = bookings[4]._id;
    bookingDiscountedId = bookings[5]._id;
    bookingSearchId = bookings[6]._id;

    console.log('--- beforeAll (Admin Booking Tests): Test bookings created ---');

    app.set('socketio', mockIo);
});

afterAll(async () => {
    await User.deleteMany({ email: /@test\.com$/ });
    await Booking.deleteMany({});
    await Service.deleteMany({ name: 'Admin Test Service' });
    await Workshop.deleteMany({});
    console.log('--- afterAll (Admin Booking Tests): Cleaned up all test data ---');

    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Admin Booking Tests): MongoDB connection closed cleanly ---');
    }

    if (server && server.listening) {
        if (io) {
            io.close();
            console.log('--- afterAll (Admin Booking Tests): Real Socket.IO connections closed ---');
        }
        if (mockIo.close) {
            mockIo.close();
        }
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (Admin Booking Tests): Express server closed cleanly ---');
    }
});

describe('Admin Booking Management', () => {

    beforeEach(async () => {
        sendEmail.mockClear();
        mockIo.to.mockClear();
        mockIo.emit.mockClear();
        puppeteer.launch.mockClear();

        await User.findByIdAndUpdate(adminUserId, {
            workshopName: 'Admin Test Workshop',
            address: 'Admin Workshop Address',
            phone: '9998887777'
        }, { new: true });
    });

    describe('GET /api/admin/bookings', () => {
        it('should allow admin to get all paid and non-archived bookings with pagination', async () => {
            const res = await request(server)
                .get('/api/admin/bookings?page=1&limit=2')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeLessThanOrEqual(2);
            expect(res.body).toHaveProperty('totalPages');
            expect(res.body).toHaveProperty('currentPage', 1);
            res.body.data.forEach(booking => {
                expect(booking.isPaid).toBe(true);
                expect(booking.archivedByAdmin).not.toBe(true);
            });
            expect(res.body.totalPages).toBe(Math.ceil(3 / 2));
        });

        it('should allow admin to search bookings by customer name, service type, bike model, pickup/dropoff address', async () => {
            const res = await request(server)
                .get('/api/admin/bookings?search=Normal User')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(3);
            expect(res.body.data[0].customer.fullName).toBe('Normal User');
            const foundBooking = res.body.data.find(b => b._id === bookingSearchId.toString());
            expect(foundBooking).toBeDefined();
            expect(foundBooking.bikeModel).toBe('Specific Search Bike');
            expect(foundBooking.pickupAddress).toBe('Specific Search Pickup Address');
        });

        it('should return no results for non-matching search', async () => {
            const res = await request(server)
                .get('/api/admin/bookings?search=NonExistentEntry')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(0);
            expect(res.body.totalPages).toBe(0);
        });

        it('should return 401 for unauthenticated access', async () => {
            const res = await request(server).get('/api/admin/bookings');
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Authentication failed: No token provided.');
        });

        it('should return 403 for non-admin user access (if isAdmin middleware is active)', async () => {
            const res = await request(server)
                .get('/api/admin/bookings')
                .set('Authorization', `Bearer ${normalToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/admin access required/i);
        });
    });

    describe('GET /api/admin/bookings/:id', () => {
        it('should allow admin to get a single booking by ID with customer details', async () => {
            const res = await request(server)
                .get(`/api/admin/bookings/${bookingCompletedPaidId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('_id', bookingCompletedPaidId.toString());
            expect(res.body.data).toHaveProperty('customer');
            expect(res.body.data.customer).toHaveProperty('fullName', 'Normal User');
            expect(res.body.data.customer).toHaveProperty('email', 'normal@test.com');
        });

        it('should return 404 if booking not found', async () => {
            const res = await request(server)
                .get(`/api/admin/bookings/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Booking not found');
        });

        it('should return 401 for unauthenticated access', async () => {
            const res = await request(server).get(`/api/admin/bookings/${bookingCompletedPaidId}`);
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 for non-admin user access (if isAdmin middleware is active)', async () => {
            const res = await request(server)
                .get(`/api/admin/bookings/${bookingCompletedPaidId}`)
                .set('Authorization', `Bearer ${normalToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/admin/bookings/:id', () => {
        it('should allow admin to update booking status and total cost', async () => {
            const tempBooking = await Booking.create({
                customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
                bikeModel: 'Update Test Bike', date: new Date(Date.now() + 5 * 86400000), notes: 'For update test',
                totalCost: 100, finalAmount: 100, status: 'Pending', paymentStatus: 'Pending', isPaid: false,
            });

            const res = await request(server)
                .put(`/api/admin/bookings/${tempBooking._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'Completed', totalCost: 750 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.status).toBe('Completed');
            expect(res.body.data.totalCost).toBe(750);
            expect(res.body.data.finalAmount).toBe(750);

            expect(mockIo.to).toHaveBeenCalledWith(`chat-${normalUserId.toString()}`);
            expect(mockIo.emit).toHaveBeenCalledWith('booking_status_update', {
                bookingId: res.body.data._id.toString(),
                serviceType: 'Admin Test Service',
                newStatus: 'Completed',
                message: `Your booking for "Admin Test Service" is now Completed.`,
            });

            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(
                'normal@test.com',
                'Your MotoFix Service is Complete!',
                expect.stringContaining('Your Service is Complete!')
            );
        });

        it('should update finalAmount if discount was applied and totalCost changes', async () => {
            const tempBooking = await Booking.create({
                customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
                bikeModel: 'Discount Update Test', date: new Date(Date.now() + 6 * 86400000), notes: 'For discount update test',
                totalCost: 1000, finalAmount: 800, status: 'Pending', paymentStatus: 'Pending', isPaid: false, discountApplied: true, discountAmount: 200,
            });

            const res = await request(server)
                .put(`/api/admin/bookings/${tempBooking._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ totalCost: 1200 });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.totalCost).toBe(1200);
            expect(res.body.data.finalAmount).toBe(960);
            expect(res.body.data.discountApplied).toBe(true);
        });

        it('should return 400 for invalid status value', async () => {
            const res = await request(server)
                .put(`/api/admin/bookings/${bookingPendingId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'InvalidStatus' });

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid status value');
        });

        it('should return 404 if booking to update not found', async () => {
            const res = await request(server)
                .put(`/api/admin/bookings/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ status: 'Completed' });

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Booking not found');
        });

        it('should return 401 for unauthenticated access', async () => {
            const res = await request(server)
                .put(`/api/admin/bookings/${bookingPendingId}`)
                .send({ status: 'Completed' });
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 for non-admin user access (if isAdmin middleware is active)', async () => {
            const res = await request(server)
                .put(`/api/admin/bookings/${bookingPendingId}`)
                .set('Authorization', `Bearer ${normalToken}`)
                .send({ status: 'Completed' });

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('DELETE /api/admin/bookings/:id', () => {
        it('should allow admin to cancel a pending booking and reverse awarded loyalty points', async () => {
            const tempBooking = await Booking.create({
                customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
                bikeModel: 'Booking to be Cancelled', date: new Date(Date.now() + 86400000), notes: 'For cancellation test',
                totalCost: 1000, finalAmount: 1000, status: 'Pending', paymentStatus: 'Paid', isPaid: true, pointsAwarded: 20,
            });
            await User.findByIdAndUpdate(normalUserId, { loyaltyPoints: 200 });
            const userBeforeDelete = await User.findById(normalUserId);
            const initialLoyaltyPoints = userBeforeDelete.loyaltyPoints;

            const res = await request(server)
                .delete(`/api/admin/bookings/${tempBooking._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Booking has been cancelled and removed from view. User has been notified.');

            const updatedBooking = await Booking.findById(tempBooking._id);
            expect(updatedBooking.status).toBe('Cancelled');
            expect(updatedBooking.archivedByAdmin).toBe(true);

            const userAfterDelete = await User.findById(normalUserId);
            expect(userAfterDelete.loyaltyPoints).toBe(initialLoyaltyPoints - 20);

            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(
                'normal@test.com',
                'Your MotoFix Booking Has Been Cancelled',
                expect.stringContaining('Booking Cancelled')
            );
            expect(sendEmail).toHaveBeenCalledWith(
                'normal@test.com',
                'Your MotoFix Booking Has Been Cancelled',
                expect.stringContaining(`The <strong>20 loyalty points</strong> you earned have been reversed.`)
            );
        });

        it('should allow admin to cancel a discounted booking and refund discount points', async () => {
            const tempBooking = await Booking.create({
                customer: normalUserId, customerName: 'Normal User', service: testServiceId, serviceType: 'Admin Test Service',
                bikeModel: 'Discount Cancel Test', date: new Date(Date.now() + 86400000), notes: 'For discount refund test',
                totalCost: 1000, finalAmount: 800, status: 'Pending', paymentStatus: 'Pending', isPaid: false, discountApplied: true, discountAmount: 200,
            });
            await User.findByIdAndUpdate(normalUserId, { loyaltyPoints: 100 });
            const userBeforeDelete = await User.findById(normalUserId);
            const initialLoyaltyPoints = userBeforeDelete.loyaltyPoints;

            const res = await request(server)
                .delete(`/api/admin/bookings/${tempBooking._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Booking has been cancelled and removed from view. User has been notified.');

            const updatedBooking = await Booking.findById(tempBooking._id);
            expect(updatedBooking.status).toBe('Cancelled');
            expect(updatedBooking.archivedByAdmin).toBe(true);

            const userAfterDelete = await User.findById(normalUserId);
            expect(userAfterDelete.loyaltyPoints).toBe(initialLoyaltyPoints + 100);

            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(
                'normal@test.com',
                'Your MotoFix Booking Has Been Cancelled',
                expect.stringContaining('Booking Cancelled')
            );
            expect(sendEmail).toHaveBeenCalledWith(
                'normal@test.com',
                'Your MotoFix Booking Has Been Cancelled',
                expect.stringContaining(`The <strong>100 loyalty points</strong> you used have been refunded.`)
            );
        });

        it('should allow admin to archive a completed/paid booking without changing status', async () => {
            await Booking.findByIdAndUpdate(bookingCompletedPaidId, { status: 'Completed', archivedByAdmin: false });

            const res = await request(server)
                .delete(`/api/admin/bookings/${bookingCompletedPaidId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Booking has been archived and removed from view.');

            const updatedBooking = await Booking.findById(bookingCompletedPaidId);
            expect(updatedBooking.status).toBe('Completed');
            expect(updatedBooking.archivedByAdmin).toBe(true);

            expect(sendEmail).not.toHaveBeenCalled();
        });

        it('should return 404 if booking not found', async () => {
            const res = await request(server)
                .delete(`/api/admin/bookings/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Booking not found.');
        });

        it('should return 401 for unauthenticated access', async () => {
            const res = await request(server).delete(`/api/admin/bookings/${bookingPendingId}`);
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 for non-admin user access (if isAdmin middleware is active)', async () => {
            const res = await request(server)
                .delete(`/api/admin/bookings/${bookingPendingId}`)
                .set('Authorization', `Bearer ${normalToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/admin/bookings/:id/invoice', () => {
        it('should generate a PDF invoice for a paid booking', async () => {
            await Booking.findByIdAndUpdate(bookingCompletedPaidId, { isPaid: true, archivedByAdmin: false });

            const res = await request(server)
                .get(`/api/admin/bookings/${bookingCompletedPaidId}/invoice`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toBe('application/pdf');
            expect(res.headers['content-disposition']).toMatch(`attachment; filename=invoice-${bookingCompletedPaidId}.pdf`);
            expect(res.body instanceof Buffer).toBe(true);
            expect(res.body.toString()).toBe('mock PDF content');

            expect(puppeteer.launch).toHaveBeenCalledTimes(1);
            expect(puppeteer.launch).toHaveBeenCalledWith({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const browserMock = puppeteer.launch.mock.results[0].value;
            expect(browserMock.newPage).toHaveBeenCalledTimes(1);
            const pageMock = browserMock.newPage.mock.results[0].value;
            expect(pageMock.setContent).toHaveBeenCalledTimes(1);
            expect(pageMock.pdf).toHaveBeenCalledTimes(1);
            expect(pageMock.pdf).toHaveBeenCalledWith({ format: 'A4', printBackground: true, margin: { top: '25px', right: '25px', bottom: '25px', left: '25px' } });
            expect(browserMock.close).toHaveBeenCalledTimes(1);
        });

        it('should return 404 if booking not found', async () => {
            const res = await request(server)
                .get(`/api/admin/bookings/${new mongoose.Types.ObjectId()}/invoice`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Booking not found.');
        });

        it('should return 400 if trying to generate invoice for an unpaid booking', async () => {
            await Booking.findByIdAndUpdate(bookingPendingId, { isPaid: false });

            const res = await request(server)
                .get(`/api/admin/bookings/${bookingPendingId}/invoice`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Cannot generate an invoice for an unpaid booking.');
        });

        it('should return 401 for unauthenticated access', async () => {
            const res = await request(server).get(`/api/admin/bookings/${bookingCompletedPaidId}/invoice`);
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should return 403 for non-admin user access (if isAdmin middleware is active)', async () => {
            const res = await request(server)
                .get(`/api/admin/bookings/${bookingCompletedPaidId}/invoice`)
                .set('Authorization', `Bearer ${normalToken}`);

            expect(res.statusCode).toBe(403);
            expect(res.body.success).toBe(false);
        });

        it('should return 500 if admin user profile (workshop details) not found', async () => {
            await User.findByIdAndUpdate(adminUserId, { workshopName: undefined, address: undefined, phone: undefined });

            const res = await request(server)
                .get(`/api/admin/bookings/${bookingCompletedPaidId}/invoice`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Admin user profile not found. Cannot generate invoice.');
        });
    });
});