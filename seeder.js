require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./models/Service');

const services = [
  {
    name: "Full Engine Servicing",
    description: "Complete diagnostics, carburetor tune-up, valve adjustment, spark plug cleaning, air filter replacement, and fresh high-grade synthetic engine oil change for ultimate performance.",
    price: 3500,
    duration: "4 Hours",
    image: "uploads/engine_service.png",
    rating: 4.8,
    numReviews: 12,
    reviews: []
  },
  {
    name: "Brake System Overhaul",
    description: "Complete front & rear caliper cleaning, high-friction brake pad replacement, hydraulic fluid flush, and level top-up to ensure responsive stopping power and street safety.",
    price: 1500,
    duration: "2 Hours",
    image: "uploads/brake_service.png",
    rating: 4.6,
    numReviews: 8,
    reviews: []
  },
  {
    name: "Chain & Sprocket Care",
    description: "Industrial grade chain degreasing, deep scrubbing, link inspection, precision alignment, tension adjustment, and advanced dry-wax lubrication spray to prevent wear.",
    price: 1200,
    duration: "1 Hour",
    image: "uploads/chain_service.png",
    rating: 4.7,
    numReviews: 15,
    reviews: []
  },
  {
    name: "Premium Wash & Detail",
    description: "Active snow foam pre-wash, high-pressure grime removal, chain washing, engine bay degreasing, hand dry with microfiber towel, and full body hydrophobic wax polish.",
    price: 800,
    duration: "1.5 Hours",
    image: "uploads/wash_service.png",
    rating: 4.9,
    numReviews: 24,
    reviews: []
  }
];

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/motofixdb";
    console.log("Connecting to Database at:", mongoURI);
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB!");

    // Clear existing services
    await Service.deleteMany({});
    console.log("Existing services cleared!");

    // Seed new services
    await Service.insertMany(services);
    console.log("Successfully seeded mock services!");

    mongoose.connection.close();
    console.log("Database connection closed cleanly.");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding process:", error);
    process.exit(1);
  }
};

seedDB();
