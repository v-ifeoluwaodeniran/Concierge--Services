require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.vendorBankAccount.deleteMany();
  await prisma.vendorPayout.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 12);

  // --- Users ---
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@concierge.ng',
      phone: '+2348000000001',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      userType: 'ADMIN',
      isVerified: true,
    },
  });

  const vendorUser1 = await prisma.user.create({
    data: {
      email: 'restaurant@concierge.ng',
      phone: '+2348000000002',
      passwordHash,
      firstName: 'Chioma',
      lastName: 'Okafor',
      userType: 'VENDOR',
      isVerified: true,
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: 'carrental@concierge.ng',
      phone: '+2348000000003',
      passwordHash,
      firstName: 'Emeka',
      lastName: 'Nwosu',
      userType: 'VENDOR',
      isVerified: true,
    },
  });

  const customerUser1 = await prisma.user.create({
    data: {
      email: 'customer1@concierge.ng',
      phone: '+2348000000004',
      passwordHash,
      firstName: 'Amaka',
      lastName: 'Eze',
      userType: 'CUSTOMER',
      isVerified: true,
    },
  });

  const customerUser2 = await prisma.user.create({
    data: {
      email: 'customer2@concierge.ng',
      phone: '+2348000000005',
      passwordHash,
      firstName: 'Tunde',
      lastName: 'Adeyemi',
      userType: 'CUSTOMER',
      isVerified: true,
    },
  });

  console.log('✅ Users created');

  // --- Vendor Profiles ---
  const restaurantVendor = await prisma.vendorProfile.create({
    data: {
      userId: vendorUser1.id,
      businessName: "Chioma's Kitchen",
      businessType: 'RESTAURANT',
      description: 'Authentic Nigerian cuisine in the heart of Lagos. We serve the finest Afro-fusion dishes.',
      address: '15 Adeola Odeku Street',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4281,
      longitude: 3.4219,
      commissionPercentage: 5.0,
      isVerified: true,
      isActive: true,
      rating: 4.5,
      totalReviews: 12,
      operatingHours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '11:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' },
      },
    },
  });

  const carRentalVendor = await prisma.vendorProfile.create({
    data: {
      userId: vendorUser2.id,
      businessName: 'Emeka Premium Cars',
      businessType: 'CAR_RENTAL',
      description: 'Luxury and economy car rentals across Nigeria. Clean, well-maintained vehicles.',
      address: '7 Ozumba Mbadiwe Avenue',
      city: 'Lagos',
      state: 'Lagos',
      latitude: 6.4355,
      longitude: 3.4212,
      commissionPercentage: 5.0,
      isVerified: true,
      isActive: true,
      rating: 4.8,
      totalReviews: 25,
      operatingHours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '16:00' },
        sunday: { open: '10:00', close: '14:00' },
      },
    },
  });

  console.log('✅ Vendor profiles created');

  // --- Bank Accounts ---
  await prisma.vendorBankAccount.create({
    data: {
      vendorId: restaurantVendor.id,
      bankName: 'Zenith Bank',
      bankCode: '057',
      accountNumber: '2012345678',
      accountName: "Chioma's Kitchen Ltd",
      isDefault: true,
    },
  });

  await prisma.vendorBankAccount.create({
    data: {
      vendorId: carRentalVendor.id,
      bankName: 'GTBank',
      bankCode: '058',
      accountNumber: '0123456789',
      accountName: 'Emeka Premium Cars',
      isDefault: true,
    },
  });

  console.log('✅ Bank accounts created');

  // --- Listings ---
  const restaurantListing = await prisma.listing.create({
    data: {
      vendorId: restaurantVendor.id,
      title: 'VIP Dining Table for 6',
      description: 'Exclusive VIP table in our private dining section. Enjoy top-tier Afro-fusion cuisine.',
      listingType: 'RESTAURANT',
      priceType: 'FREE',
      price: 0,
      capacity: 6,
      isAvailable: true,
    },
  });

  const carListing1 = await prisma.listing.create({
    data: {
      vendorId: carRentalVendor.id,
      title: 'Toyota Camry 2022',
      description: 'Sleek and comfortable Toyota Camry perfect for business and leisure trips.',
      listingType: 'CAR_RENTAL',
      priceType: 'PER_DAY',
      price: 35000,
      priceUnit: 'day',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleYear: 2022,
      isAvailable: true,
    },
  });

  const carListing2 = await prisma.listing.create({
    data: {
      vendorId: carRentalVendor.id,
      title: 'Mercedes-Benz E-Class 2023',
      description: 'Premium luxury vehicle for executive travel. Driver available on request.',
      listingType: 'CAR_RENTAL',
      priceType: 'PER_DAY',
      price: 85000,
      priceUnit: 'day',
      vehicleMake: 'Mercedes-Benz',
      vehicleModel: 'E-Class',
      vehicleYear: 2023,
      isAvailable: true,
    },
  });

  console.log('✅ Listings created');

  // --- Sample Bookings ---
  const booking1 = await prisma.booking.create({
    data: {
      bookingReference: 'BK_SEED_001',
      customerId: customerUser1.id,
      vendorId: restaurantVendor.id,
      listingId: restaurantListing.id,
      bookingType: 'RESERVATION',
      startDate: new Date('2025-02-15T19:00:00Z'),
      startTime: '19:00',
      endTime: '21:00',
      guestCount: 4,
      specialRequests: 'Please prepare a birthday cake.',
      subtotal: 0,
      serviceFee: 0,
      commissionAmount: 0,
      totalAmount: 0,
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      bookingReference: 'BK_SEED_002',
      customerId: customerUser2.id,
      vendorId: carRentalVendor.id,
      listingId: carListing1.id,
      bookingType: 'RENTAL',
      startDate: new Date('2025-02-10T08:00:00Z'),
      endDate: new Date('2025-02-12T08:00:00Z'),
      guestCount: 1,
      specialRequests: 'Please ensure fuel is full.',
      subtotal: 70000,
      serviceFee: 3500,
      commissionAmount: 3500,
      totalAmount: 73500,
      paymentStatus: 'PAID',
      paymentReference: 'PAY_SEED_REF_001',
      status: 'COMPLETED',
    },
  });

  console.log('✅ Bookings created');

  // --- Reviews ---
  await prisma.review.create({
    data: {
      bookingId: booking1.id,
      customerId: customerUser1.id,
      vendorId: restaurantVendor.id,
      rating: 5,
      comment: 'Amazing experience! The food was absolutely delicious.',
      vendorResponse: 'Thank you so much for your kind words!',
      isVisible: true,
    },
  });

  await prisma.review.create({
    data: {
      bookingId: booking2.id,
      customerId: customerUser2.id,
      vendorId: carRentalVendor.id,
      rating: 5,
      comment: 'Car was spotless and the service was excellent.',
      isVisible: true,
    },
  });

  console.log('✅ Reviews created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\nTest accounts (password: Password123!):');
  console.log('  Admin:     admin@concierge.ng');
  console.log('  Vendor 1:  restaurant@concierge.ng');
  console.log('  Vendor 2:  carrental@concierge.ng');
  console.log('  Customer:  customer1@concierge.ng');
  console.log('  Customer:  customer2@concierge.ng');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
