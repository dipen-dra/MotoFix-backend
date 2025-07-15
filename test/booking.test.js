const request = require('supertest');
const { app, server, io } = require('../index');
const mongoose = require('mongoose');

const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Workshop = require('../models/Workshop');

let token;
let userId;
let testUserFullName = 'Booking Test User';
let testServiceId;
let testWorkshopId;

let initialBookingId;
let paidBookingId;
let inProgressBookingId;
let pendingForDeleteBookingId;
let pendingForDiscountInsufficientId;
let pendingForKhaltiId;

jest.mock('axios', () => ({
    post: jest.fn(() => Promise.resolve({ data: { idx: 'mock_khalti_idx', status: 'COMPLETE' } }))
}));

jest.mock('../utils/sendEmail');
const sendEmail = require('../utils/sendEmail');

beforeAll(async () => {
    await User.deleteMany({ email: 'bookingtestuser@example.com' });
    await Booking.deleteMany({});
    await Service.deleteMany({ name: 'Test Booking Service' });
    await Workshop.deleteMany({});
    console.log('--- beforeAll (Booking Tests): Cleaned up previous test data ---');

    const workshop = await Workshop.create({
        ownerName: 'Booking Workshop Owner',
        workshopName: 'Booking MotoFix Workshop',
        email: 'booking.workshop@example.com',
        phone: '111-222-3333',
        address: '456 Test Lane, Kathmandu',
        profilePicture: 'https://example.com/booking-workshop.jpg',
        offerPickupDropoff: true,
        pickupDropoffChargePerKm: 20,
    });
    testWorkshopId = workshop._id;
    console.log('--- beforeAll (Booking Tests): Created test workshop ---');

    const registerRes = await request(server)
        .post('/api/auth/register')
        .send({
            fullName: testUserFullName,
            email: 'bookingtestuser@example.com',
            password: 'SecureBookingPass123!',
            phone: '9876543211',
            address: 'Test Address 123',
        });
    expect(registerRes.statusCode).toBe(201);

    const loginRes = await request(server)
        .post('/api/auth/login')
        .send({
            email: 'bookingtestuser@example.com',
            password: 'SecureBookingPass123!',
        });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    token = loginRes.body.token;

    const user = await User.findOne({ email: 'bookingtestuser@example.com' });
    expect(user).not.toBeNull();
    userId = user._id;
    user.loyaltyPoints = 200;
    await user.save();
    console.log(`--- beforeAll (Booking Tests): User ${testUserFullName} created and logged in. Loyalty points: ${user.loyaltyPoints} ---`);

    const service = await Service.create({
        name: 'Test Booking Service',
        description: 'A service for testing bookings functionality.',
        price: 1000,
        duration: 90,
        availability: true,
        image: 'https://example.com/booking-service-image.jpg'
    });
    testServiceId = service._id;
    console.log('--- beforeAll (Booking Tests): Created test service ---');

    const bookings = await Booking.create([
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'Honda Initial',
            date: new Date(Date.now() + 86400000),
            notes: 'Initial booking for general tests.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'Yamaha Generic Pending',
            date: new Date(Date.now() + 2 * 86400000),
            notes: 'Generic pending booking.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'Bajaj Completed',
            date: new Date(Date.now() - 86400000),
            notes: 'Completed and paid booking.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'Completed',
            paymentStatus: 'Paid',
            isPaid: true,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'Suzuki In-Progress',
            date: new Date(Date.now() + 3 * 86400000),
            notes: 'Booking in progress.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'In Progress',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'KTM Delete',
            date: new Date(Date.now() + 4 * 86400000),
            notes: 'Booking to be deleted.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'TVSApache-lowPoints',
            date: new Date(Date.now() + 5 * 86400000),
            notes: 'Booking for low loyalty points discount test.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
        },
        {
            customer: userId,
            customerName: testUserFullName,
            service: testServiceId,
            serviceType: 'Test Booking Service',
            bikeModel: 'Electric Scooter-Khalti',
            date: new Date(Date.now() + 6 * 86400000),
            notes: 'Booking for Khalti test.',
            totalCost: 1000,
            finalAmount: 1000,
            status: 'Pending',
            paymentStatus: 'Pending',
            isPaid: false,
        },
    ]);

    initialBookingId = bookings[0]._id;
    paidBookingId = bookings[2]._id;
    inProgressBookingId = bookings[3]._id;
    pendingForDeleteBookingId = bookings[4]._id;
    pendingForDiscountInsufficientId = bookings[5]._id;
    pendingForKhaltiId = bookings[6]._id;

    console.log('--- beforeAll (Booking Tests): Created test bookings ---');
});

afterAll(async () => {
    await User.deleteMany({ email: 'bookingtestuser@example.com' });
    await Booking.deleteMany({});
    await Service.deleteMany({ name: 'Test Booking Service' });
    await Workshop.deleteMany({});
    console.log('--- afterAll (Booking Tests): Cleaned up all test data ---');

    if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
        console.log('--- afterAll (Booking Tests): MongoDB connection closed cleanly ---');
    }

    if (server && server.listening) {
        if (io) {
            io.close();
            console.log('--- afterAll (Booking Tests): Socket.IO connections closed ---');
        }
        await new Promise(resolve => server.close(resolve));
        console.log('--- afterAll (Booking Tests): Express server closed cleanly ---');
    }
});

describe('User Booking Operations', () => {

    beforeEach(() => {
        sendEmail.mockClear();
    });

    it('should create a new booking successfully without pickup/dropoff', async () => {
        const res = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Honda New Creation',
                date: new Date(Date.now() + 86400000).toISOString(),
                notes: 'Newly created booking test.',
                requestedPickupDropoff: false
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.customer.toString()).toBe(userId.toString());
        expect(res.body.data.serviceType).toBe('Test Booking Service');
        expect(res.body.data.totalCost).toBe(1000);
        expect(res.body.data.finalAmount).toBe(1000);
        expect(res.body.data.status).toBe('Pending');
        expect(res.body.data.paymentStatus).toBe('Pending');
        expect(res.body.data.requestedPickupDropoff).toBe(false);
        expect(res.body.message).toBe('Booking created. Please complete payment.');
    });

    it('should create a new booking successfully WITH pickup/dropoff', async () => {
        const res = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'KTM Duke 200',
                date: new Date(Date.now() + 3 * 86400000).toISOString(),
                notes: 'Booking with P/D.',
                requestedPickupDropoff: true,
                pickupAddress: 'Customer Home Address',
                dropoffAddress: 'Customer Dropoff Address',
                pickupCoordinates: { lat: 27.7000, lng: 85.3000 },
                dropoffCoordinates: { lat: 27.7050, lng: 85.3050 }
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.requestedPickupDropoff).toBe(true);
        expect(res.body.data.pickupAddress).toBe('Customer Home Address');
        expect(res.body.data.dropoffAddress).toBe('Customer Dropoff Address');
        expect(res.body.data.pickupDropoffDistance).toBeGreaterThan(0);
        expect(res.body.data.pickupDropoffCost).toBeGreaterThan(0);
        expect(res.body.data.finalAmount).toBeGreaterThan(res.body.data.totalCost);
    });

    it('should return 400 if pickup/dropoff is requested but details are incomplete', async () => {
        const res = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Yamaha FZ',
                date: new Date().toISOString(),
                requestedPickupDropoff: true,
                pickupAddress: 'Only pickup address provided'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Pickup/Dropoff details are incomplete.');
    });

    it('should return 400 if pickup/dropoff is requested but workshop does not offer it', async () => {
        await Workshop.findByIdAndUpdate(testWorkshopId, { offerPickupDropoff: false });

        const res = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Scooter',
                date: new Date().toISOString(),
                requestedPickupDropoff: true,
                pickupAddress: 'Valid address',
                dropoffAddress: 'Valid address',
                pickupCoordinates: { lat: 1, lng: 1 },
                dropoffCoordinates: { lat: 2, lng: 2 }
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Pickup and Dropoff service is not offered by the workshop.');

        await Workshop.findByIdAndUpdate(testWorkshopId, { offerPickupDropoff: true });
    });


    it('should get a paginated list of user bookings', async () => {
        const res = await request(server)
            .get('/api/user/bookings?page=1&limit=2')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeLessThanOrEqual(2);
        expect(res.body).toHaveProperty('totalPages');
        expect(res.body).toHaveProperty('currentPage', 1);
    });

    it('should get a single booking by ID', async () => {
        const res = await request(server)
            .get(`/api/user/bookings/${initialBookingId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data._id.toString()).toBe(initialBookingId.toString());
        expect(res.body.data.serviceType).toBe('Test Booking Service');
    });

    it('should return 404 if booking not found by ID', async () => {
        const res = await request(server)
            .get(`/api/user/bookings/${new mongoose.Types.ObjectId()}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Booking not found/i);
    });

    it('should get all pending bookings for the user', async () => {
        const res = await request(server)
            .get('/api/user/bookings/pending')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(8);
        res.body.data.forEach(booking => {
            expect(booking.paymentStatus).toBe('Pending');
            expect(booking.status).not.toBe('Cancelled');
            expect(booking.status).not.toBe('Completed');
        });
    });

    it('should get all paid bookings for the user (history)', async () => {
        const res = await request(server)
            .get('/api/user/bookings/history')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].paymentStatus).toBe('Paid');
        expect(res.body.data[0].isPaid).toBe(true);
    });


    it('should update a pending booking successfully', async () => {
        const updatedDate = new Date(Date.now() + 5 * 86400000).toISOString();
        const res = await request(server)
            .put(`/api/user/bookings/${initialBookingId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                bikeModel: 'New Bike Model',
                date: updatedDate,
                notes: 'Updated notes for the booking.',
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.bikeModel).toBe('New Bike Model');
        expect(new Date(res.body.data.date).toISOString()).toBe(updatedDate);
        expect(res.body.data.notes).toBe('Updated notes for the booking.');
    });

    it('should update a pending booking and change pickup/dropoff status', async () => {
        const tempBookingRes = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Test Bike for P/D Update',
                date: new Date().toISOString(),
                notes: 'Temporary for P/D update test',
                requestedPickupDropoff: false
            });
        expect(tempBookingRes.statusCode).toBe(201);
        const tempBookingId = tempBookingRes.body.data._id;

        const res = await request(server)
            .put(`/api/user/bookings/${tempBookingId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                requestedPickupDropoff: true,
                pickupAddress: 'New Pickup Address',
                dropoffAddress: 'New Dropoff Address',
                pickupCoordinates: { lat: 27.7, lng: 85.3 },
                dropoffCoordinates: { lat: 27.71, lng: 85.31 }
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.requestedPickupDropoff).toBe(true);
        expect(res.body.data.pickupAddress).toBe('New Pickup Address');
        expect(res.body.data.dropoffAddress).toBe('New Dropoff Address');
        expect(res.body.data.pickupDropoffDistance).toBeGreaterThan(0);
        expect(res.body.data.pickupDropoffCost).toBeGreaterThan(0);
        expect(res.body.data.finalAmount).toBeGreaterThan(res.body.data.totalCost);

        const res2 = await request(server)
            .put(`/api/user/bookings/${tempBookingId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                requestedPickupDropoff: false
            });
        expect(res2.statusCode).toBe(200);
        expect(res2.body.success).toBe(true);
        expect(res2.body.data.requestedPickupDropoff).toBe(false);
        expect(res2.body.data.pickupAddress).toBe('');
        expect(res2.body.data.dropoffAddress).toBe('');
        expect(res2.body.data.pickupCoordinates).toBeUndefined();
        expect(res2.body.data.dropoffCoordinates).toBeUndefined();
        expect(res2.body.data.pickupDropoffDistance).toBe(0);
        expect(res2.body.data.pickupDropoffCost).toBe(0);
        expect(res2.body.data.finalAmount).toBe(res2.body.data.totalCost);
    });


    it('should return 400 if trying to update a paid or in-progress booking', async () => {
        const resPaid = await request(server)
            .put(`/api/user/bookings/${paidBookingId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ bikeModel: 'Tried to change paid' });

        expect(resPaid.statusCode).toBe(400);
        expect(resPaid.body.success).toBe(false);
        expect(resPaid.body.message).toMatch(/Cannot edit a booking that is already in progress, paid, or has a discount/i);

        const resInProgress = await request(server)
            .put(`/api/user/bookings/${inProgressBookingId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ bikeModel: 'Tried to change in-progress' });

        expect(resInProgress.statusCode).toBe(400);
        expect(resInProgress.body.success).toBe(false);
        expect(resInProgress.body.message).toMatch(/Cannot edit a booking that is already in progress, paid, or has a discount/i);
    });

    it('should delete a pending booking successfully', async () => {
        const res = await request(server)
            .delete(`/api/user/bookings/${pendingForDeleteBookingId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/Booking cancelled successfully/i);

        const deletedBooking = await Booking.findById(pendingForDeleteBookingId);
        expect(deletedBooking).toBeNull();
    });

    it('should refund loyalty points if a discounted booking is cancelled', async () => {
        const tempDiscountRefundBookingRes = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Temp Discount for Refund',
                date: new Date().toISOString(),
                notes: 'Booking for discount refund test.',
                requestedPickupDropoff: false
            });
        expect(tempDiscountRefundBookingRes.statusCode).toBe(201);
        const tempDiscountRefundBookingId = tempDiscountRefundBookingRes.body.data._id;

        let userBeforeDiscount = await User.findById(userId);
        await User.findByIdAndUpdate(userId, { loyaltyPoints: userBeforeDiscount.loyaltyPoints + 100 });
        userBeforeDiscount = await User.findById(userId);
        const initialLoyaltyPoints = userBeforeDiscount.loyaltyPoints;

        const discountRes = await request(server)
            .put(`/api/user/bookings/${tempDiscountRefundBookingId}/apply-discount`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Refund Loyalty Points - Apply Discount Status:', discountRes.statusCode, discountRes.body);

        expect(discountRes.statusCode).toBe(200);
        expect(discountRes.body.success).toBe(true);
        expect(discountRes.body.data.booking.discountApplied).toBe(true);
        expect(discountRes.body.data.loyaltyPoints).toBe(initialLoyaltyPoints - 100);

        const deleteRes = await request(server)
            .delete(`/api/user/bookings/${tempDiscountRefundBookingId}`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Refund Loyalty Points - Delete Status:', deleteRes.statusCode, deleteRes.body);

        expect(deleteRes.statusCode).toBe(200);
        expect(deleteRes.body.success).toBe(true);
        expect(deleteRes.body.message).toMatch(/Any used loyalty points have been refunded/i);

        const userAfterRefund = await User.findById(userId);
        expect(userAfterRefund.loyaltyPoints).toBe(initialLoyaltyPoints);
    });

    it('should return 400 if trying to delete a paid booking', async () => {
        const res = await request(server)
            .delete(`/api/user/bookings/${paidBookingId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Cannot cancel a booking that has been paid for.');
    });

    it('should confirm COD payment for a booking and award loyalty points', async () => {
        await Booking.findByIdAndUpdate(initialBookingId, { isPaid: false, paymentStatus: 'Pending', discountApplied: false });

        const booking = await Booking.findById(initialBookingId);
        expect(booking.isPaid).toBe(false);
        expect(booking.paymentStatus).toBe('Pending');

        const userBeforePayment = await User.findById(userId);
        const initialPoints = userBeforePayment.loyaltyPoints;

        const res = await request(server)
            .put(`/api/user/bookings/${initialBookingId}/pay`)
            .set('Authorization', `Bearer ${token}`)
            .send({ paymentMethod: 'COD' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.isPaid).toBe(true);
        expect(res.body.data.paymentStatus).toBe('Paid');
        expect(res.body.message).toMatch(/Payment confirmed! You've earned \d+ loyalty points./);

        const userAfterPayment = await User.findById(userId);
        expect(userAfterPayment.loyaltyPoints).toBeGreaterThan(initialPoints);
        expect(res.body.data.pointsAwarded).toBe(userAfterPayment.loyaltyPoints - initialPoints);

        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('Your MotoFix Booking is Confirmed!'),
            expect.stringContaining('Cash on Delivery (COD)')
        );
    });

    it('should return 400 if booking is already paid (COD)', async () => {
        const res = await request(server)
            .put(`/api/user/bookings/${initialBookingId}/pay`)
            .set('Authorization', `Bearer ${token}`)
            .send({ paymentMethod: 'COD' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Booking is already paid.');
    });

    it('should verify Khalti payment and update booking status and award loyalty points', async () => {
        await Booking.findByIdAndUpdate(pendingForKhaltiId, { isPaid: false, paymentStatus: 'Pending', discountApplied: false });

        const booking = await Booking.findById(pendingForKhaltiId);
        const khaltiBookingAmount = booking.finalAmount;

        const userBeforeKhaltiPayment = await User.findById(userId);
        const initialPoints = userBeforeKhaltiPayment.loyaltyPoints;

        const res = await request(server)
            .post('/api/user/bookings/verify-khalti')
            .set('Authorization', `Bearer ${token}`)
            .send({
                token: 'mock_khalti_token',
                amount: khaltiBookingAmount * 100,
                booking_id: pendingForKhaltiId.toString()
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/Payment successful! You've earned \d+ loyalty points./);

        const updatedBooking = await Booking.findById(pendingForKhaltiId);
        expect(updatedBooking.isPaid).toBe(true);
        expect(updatedBooking.paymentStatus).toBe('Paid');
        expect(updatedBooking.paymentMethod).toBe('Khalti');
        expect(updatedBooking.pointsAwarded).toBeGreaterThan(0);

        const userAfterKhaltiPayment = await User.findById(userId);
        expect(userAfterKhaltiPayment.loyaltyPoints).toBeGreaterThan(initialPoints);

        expect(sendEmail).toHaveBeenCalledTimes(1);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('Your MotoFix Booking is Confirmed!'),
            expect.stringContaining('successfully processed via Khalti')
        );
    });

    it('should return 400 if Khalti verification details are missing', async () => {
        const res = await request(server)
            .post('/api/user/bookings/verify-khalti')
            .set('Authorization', `Bearer ${token}`)
            .send({
                token: 'mock_token',
                amount: 1000
            });
        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Missing payment verification details.');
    });

    it('should apply loyalty discount to a booking and deduct points', async () => {
        const tempDiscountBookingRes = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Temp Bike for Discount',
                date: new Date().toISOString(),
                notes: 'Temporary for discount test.',
                requestedPickupDropoff: false
            });
        expect(tempDiscountBookingRes.statusCode).toBe(201);
        const tempDiscountBookingId = tempDiscountBookingRes.body.data._id;

        let userBeforeDiscount = await User.findById(userId);
        await User.findByIdAndUpdate(userId, { loyaltyPoints: userBeforeDiscount.loyaltyPoints + 100 });
        userBeforeDiscount = await User.findById(userId);
        const initialLoyaltyPoints = userBeforeDiscount.loyaltyPoints;

        const booking = await Booking.findById(tempDiscountBookingId);
        if (!booking) {
            throw new Error('Booking for discount test was not found!');
        }

        expect(booking.discountApplied).toBe(false);
        expect(booking.isPaid).toBe(false);

        const res = await request(server)
            .put(`/api/user/bookings/${tempDiscountBookingId}/apply-discount`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Apply discount response (should be 200):', res.statusCode, res.body);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/20% discount applied!/);
        expect(res.body.data.booking.discountApplied).toBe(true);
        expect(res.body.data.booking.discountAmount).toBeCloseTo(booking.finalAmount * 0.20);
        expect(res.body.data.booking.finalAmount).toBeCloseTo(booking.finalAmount * 0.80);

        const userAfterDiscount = await User.findById(userId);
        expect(userAfterDiscount.loyaltyPoints).toBe(initialLoyaltyPoints - 100);
    });

    it('should return 400 if not enough loyalty points for discount', async () => {
        await Booking.findByIdAndUpdate(pendingForDiscountInsufficientId, { discountApplied: false, isPaid: false });
        await User.findByIdAndUpdate(userId, { loyaltyPoints: 50 });

        const res = await request(server)
            .put(`/api/user/bookings/${pendingForDiscountInsufficientId}/apply-discount`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Not enough loyalty points. You need at least 100.');

        await User.findByIdAndUpdate(userId, { loyaltyPoints: 200 });
    });

    it('should return 400 if discount already applied', async () => {
        const tempAlreadyDiscountedBookingRes = await request(server)
            .post('/api/user/bookings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                serviceId: testServiceId,
                bikeModel: 'Temp Discount Applied',
                date: new Date().toISOString(),
                notes: 'Booking for discount already applied test.',
                requestedPickupDropoff: false
            });
        expect(tempAlreadyDiscountedBookingRes.statusCode).toBe(201);
        const tempAlreadyDiscountedBookingId = tempAlreadyDiscountedBookingRes.body.data._id;

        const applyRes = await request(server)
            .put(`/api/user/bookings/${tempAlreadyDiscountedBookingId}/apply-discount`)
            .set('Authorization', `Bearer ${token}`);
        expect(applyRes.statusCode).toBe(200);

        const res = await request(server)
            .put(`/api/user/bookings/${tempAlreadyDiscountedBookingId}/apply-discount`)
            .set('Authorization', `Bearer ${token}`);

        console.log('Discount already applied response (should be 400):', res.statusCode, res.body);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Discount has already been applied.');
    });

    it('should return 400 if trying to apply discount to a paid booking', async () => {
        const paidBooking = await Booking.findById(initialBookingId);
        expect(paidBooking.isPaid).toBe(true);

        const res = await request(server)
            .put(`/api/user/bookings/${paidBooking._id}/apply-discount`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Cannot apply discount to a paid booking.');
    });

    it('should return 401 for unauthenticated access to any booking route', async () => {
        if (!initialBookingId || !paidBookingId || !inProgressBookingId) {
            console.warn('Skipping unauthenticated access tests due to missing critical booking IDs. Ensure beforeAll completes successfully.');
            throw new Error('Required booking IDs are null. Check beforeAll setup and data population.');
        }

        const dummyObjectId = new mongoose.Types.ObjectId().toString();

        const routesToTestGET = [
            '/api/user/bookings',
            `/api/user/bookings/${dummyObjectId}`,
            '/api/user/bookings/pending',
            '/api/user/bookings/history'
        ];

        for (const route of routesToTestGET) {
            const res = await request(server).get(route);
            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/not authorized|no token/i);
        }

        const postRes = await request(server)
            .post('/api/user/bookings')
            .send({ serviceId: testServiceId, bikeModel: 'Unauth Bike', date: new Date().toISOString() });
        expect(postRes.statusCode).toBe(401);
        expect(postRes.body.success).toBe(false);
        expect(postRes.body.message).toMatch(/not authorized|no token/i);

        const putResUpdate = await request(server)
            .put(`/api/user/bookings/${dummyObjectId}`)
            .send({ bikeModel: 'Unauth Update' });
        expect(putResUpdate.statusCode).toBe(401);
        expect(putResUpdate.body.success).toBe(false);
        expect(putResUpdate.body.message).toMatch(/not authorized|no token/i);

        const putResPay = await request(server)
            .put(`/api/user/bookings/${dummyObjectId}/pay`)
            .send({ paymentMethod: 'COD' });
        expect(putResPay.statusCode).toBe(401);
        expect(putResPay.body.success).toBe(false);
        expect(putResPay.body.message).toMatch(/not authorized|no token/i);

        const putResDiscount = await request(server)
            .put(`/api/user/bookings/${dummyObjectId}/apply-discount`)
            .send({});
        expect(putResDiscount.statusCode).toBe(401);
        expect(putResDiscount.body.success).toBe(false);
        expect(putResDiscount.body.message).toMatch(/not authorized|no token/i);

        const postResKhalti = await request(server)
            .post('/api/user/bookings/verify-khalti')
            .send({ token: 'dummy', amount: 100, booking_id: dummyObjectId });
        expect(postResKhalti.statusCode).toBe(401);
        expect(postResKhalti.body.success).toBe(false);
        expect(postResKhalti.body.message).toMatch(/not authorized|no token/i);

        const deleteRes = await request(server)
            .delete(`/api/user/bookings/${dummyObjectId}`);
        expect(deleteRes.statusCode).toBe(401);
        expect(deleteRes.body.success).toBe(false);
        expect(deleteRes.body.message).toMatch(/not authorized|no token/i);
    });

});