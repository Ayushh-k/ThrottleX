const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Partner = require('../models/Partner');
const Bike = require('../models/Bike');
const Customer = require('../models/Customer');
const Rental = require('../models/Rental');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const FuelEntry = require('../models/FuelEntry');
const Maintenance = require('../models/Maintenance');
const Settlement = require('../models/Settlement');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

async function seed() {
  await connectDB();
  console.log('[Seed] Connected to database. Clearing existing collections...');

  await Promise.all([
    User.deleteMany({}),
    Partner.deleteMany({}),
    Bike.deleteMany({}),
    Customer.deleteMany({}),
    Rental.deleteMany({}),
    Payment.deleteMany({}),
    Expense.deleteMany({}),
    FuelEntry.deleteMany({}),
    Maintenance.deleteMany({}),
    Settlement.deleteMany({}),
    Transaction.deleteMany({}),
    Notification.deleteMany({}),
    Settings.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  console.log('[Seed] Creating Settings...');
  const settings = await Settings.create({
    businessName: 'THROTTLEX',
    tagline: 'OWN THE ROAD.',
    currency: '₹',
    defaultDailyRate: 900,
    gracePeriodHours: 2,
    hourlyLateFee: 100,
    extraDayFee: 1000,
    theme: 'dark'
  });

  console.log('[Seed] Creating Partners and Users...');
  const partnerA = await Partner.create({
    name: 'Ayush Sharma',
    email: 'ayush@throttlex.com',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    sharePercentage: 50,
    status: 'active',
    initialCapital: 100000,
    notes: 'Managing partner & Operations'
  });

  const partnerB = await Partner.create({
    name: 'Vikram Malhotra',
    email: 'vikram@throttlex.com',
    phone: '+91 98111 22334',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    sharePercentage: 50,
    status: 'active',
    initialCapital: 100000,
    notes: 'Partner & Fleet Management'
  });

  const userA = await User.create({
    name: 'Ayush Sharma',
    email: 'ayush@throttlex.com',
    password: 'password123',
    role: 'owner',
    phone: '+91 98765 43210',
    partnerId: partnerA._id,
    avatar: partnerA.avatar
  });

  const userB = await User.create({
    name: 'Vikram Malhotra',
    email: 'vikram@throttlex.com',
    password: 'password123',
    role: 'partner',
    phone: '+91 98111 22334',
    partnerId: partnerB._id,
    avatar: partnerB.avatar
  });

  partnerA.userId = userA._id;
  await partnerA.save();
  partnerB.userId = userB._id;
  await partnerB.save();

  console.log('[Seed] Creating 3 Iconic Royal Enfield Bikes...');
  const bikeHunter = await Bike.create({
    name: 'Royal Enfield Hunter 350',
    brand: 'Royal Enfield',
    model: 'Hunter 350',
    variant: 'Dapper Ash',
    registrationNumber: 'DL 01 AB 1234',
    chassisNumber: 'ME3HUNTER350ABC01',
    engineNumber: 'J1-349CC-9821',
    purchaseDate: new Date('2025-02-15'),
    purchasePrice: 175000,
    defaultDailyRate: 900,
    currentOdometer: 8450,
    fuelType: 'Petrol',
    color: 'Dapper Ash',
    imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    status: 'available',
    insuranceExpiryDate: new Date('2027-02-14'),
    nextServiceOdo: 9000, // Service due in 550 km
    nextServiceDate: new Date('2026-12-15'),
    notes: 'Urban roadster, exceptionally high rental demand.'
  });

  const bikeClassic = await Bike.create({
    name: 'Royal Enfield Classic 350',
    brand: 'Royal Enfield',
    model: 'Classic 350',
    variant: 'Dark Stealth Black',
    registrationNumber: 'HR 26 DQ 5678',
    chassisNumber: 'ME3CLASSIC350XYZ02',
    engineNumber: 'J1-349CC-5544',
    purchaseDate: new Date('2025-01-10'),
    purchasePrice: 220000,
    defaultDailyRate: 1000,
    currentOdometer: 14200,
    fuelType: 'Petrol',
    color: 'Stealth Black',
    imageUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
    status: 'rented',
    insuranceExpiryDate: new Date('2027-01-09'),
    nextServiceOdo: 15000,
    nextServiceDate: new Date('2027-01-15'),
    notes: 'Timeless cruiser. Equipped with dual-channel ABS and touring seats.'
  });

  const bikeHimalayan = await Bike.create({
    name: 'Royal Enfield Himalayan 450',
    brand: 'Royal Enfield',
    model: 'Himalayan 450',
    variant: 'Kamet White',
    registrationNumber: 'UP 16 CZ 9988',
    chassisNumber: 'ME3HIMALAYAN450KM03',
    engineNumber: 'SHERPA452-1102',
    purchaseDate: new Date('2025-03-01'),
    purchasePrice: 285000,
    defaultDailyRate: 1400,
    currentOdometer: 11800,
    fuelType: 'Petrol',
    color: 'Kamet White',
    imageUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    status: 'available',
    insuranceExpiryDate: new Date('2027-02-28'),
    nextServiceOdo: 12000, // Due in 200 km -> Triggers urgent alert!
    nextServiceDate: new Date('2026-11-25'),
    notes: 'Adventure tourer. Panniers mounted. Highly preferred for Ladakh/Himachal trips.'
  });

  console.log('[Seed] Creating 10 Customers...');
  const customerData = [
    { name: 'Rahul Verma', phone: '+91 98234 11223', email: 'rahul.verma@gmail.com', dlNumber: 'DL0420180045231', address: 'B-42, Lajpat Nagar, New Delhi' },
    { name: 'Ananya Deshmukh', phone: '+91 99345 22334', email: 'ananya.d@outlook.com', dlNumber: 'MH0220200088712', address: 'Flat 402, Sea Green Apts, Worli, Mumbai' },
    { name: 'Rohan Mehra', phone: '+91 98456 33445', email: 'rohan.mehra@techcorp.in', dlNumber: 'KA0320190019283', address: 'Indiranagar 100ft Rd, Bangalore' },
    { name: 'Kavita Singh', phone: '+91 97567 44556', email: 'kavita.singh@gmail.com', dlNumber: 'HR2620210091823', address: 'DLF Phase 4, Gurugram' },
    { name: 'Aditya Kapoor', phone: '+91 98678 55667', email: 'aditya.k@gmail.com', dlNumber: 'UP1620170067432', address: 'Sector 62, Noida' },
    { name: 'Pooja Nair', phone: '+91 99789 66778', email: 'pooja.nair@travelindia.org', dlNumber: 'KL0720220038472', address: 'MG Road, Kochi' },
    { name: 'Vikramaditya Roy', phone: '+91 98890 77889', email: 'v.roy@gmail.com', dlNumber: 'WB0120190098471', address: 'Salt Lake Sector 5, Kolkata' },
    { name: 'Neha Chawla', phone: '+91 98901 88990', email: 'neha.c@gmail.com', dlNumber: 'DL0120200054321', address: 'Defence Colony, New Delhi' },
    { name: 'Siddharth Joshi', phone: '+91 98123 99001', email: 'sid.joshi@pune.edu', dlNumber: 'MH1220180012938', address: 'Kothrud, Pune' },
    { name: 'Deepak Patel', phone: '+91 98234 00112', email: 'deepak.patel@ahmedabad.biz', dlNumber: 'GJ0120210049281', address: 'SG Highway, Ahmedabad' }
  ];

  const customers = await Customer.create(customerData);

  console.log('[Seed] Creating Demo Scenario & Historical Data...');
  // Scenario from User Prompt:
  // Hunter 350 rented for 4 days.
  // Daily rent: ₹900. Total: ₹3,600.
  // Customer pays: ₹2,000. Outstanding: ₹1,600.
  // Petrol expense: ₹600 Paid by Partner A (Ayush)
  // Service: ₹1,500 Paid by Partner B (Vikram)

  const now = new Date();
  const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

  // 1. Prompt Demo Rental (Rahul Verma renting Hunter 350)
  const rental1 = await Rental.create({
    rentalNumber: 'TX-R-1001',
    bike: bikeHunter._id,
    customer: customers[0]._id, // Rahul Verma
    startDate: fourDaysAgo,
    expectedEndDate: now,
    dailyRate: 900,
    totalDays: 4,
    securityDeposit: 2000,
    extraCharges: 0,
    discount: 0,
    totalAmount: 3600,
    amountPaid: 2000,
    remainingAmount: 1600,
    status: 'active',
    paymentStatus: 'partially_paid',
    startOdometer: 8100,
    notes: 'Touring to Jaipur weekend trip',
    createdBy: userA._id
  });

  // Payment for Rental 1 received by Partner A (Ayush)
  const payment1 = await Payment.create({
    receiptNumber: 'TX-PAY-1001',
    rental: rental1._id,
    customer: customers[0]._id,
    amount: 2000,
    paymentDate: fourDaysAgo,
    paymentMethod: 'upi',
    receivedByPartner: partnerA._id,
    transactionReference: 'UPI/612093847291',
    notes: 'Advance booking payment',
    createdBy: userA._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10001',
    date: fourDaysAgo,
    type: 'customer_payment',
    amount: 2000,
    description: `Rental payment received for #TX-R-1001 (Rahul Verma)`,
    bike: bikeHunter._id,
    receivedByPartner: partnerA._id,
    customer: customers[0]._id,
    paymentMethod: 'upi',
    relatedId: payment1._id,
    relatedModel: 'Payment',
    balanceImpact: 'credit'
  });

  // Prompt Scenario Expense 1: Petrol ₹600 Paid by Partner A (Ayush)
  const expensePetrol = await Expense.create({
    expenseNumber: 'TX-EXP-1001',
    bike: bikeHunter._id,
    category: 'petrol',
    amount: 600,
    expenseDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    paidByPartner: partnerA._id,
    paymentMethod: 'upi',
    description: 'Petrol top-up before trip handover (6 Litres)',
    odometer: 8100,
    createdBy: userA._id
  });

  await FuelEntry.create({
    bike: bikeHunter._id,
    date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    litres: 6,
    amount: 600,
    pricePerLitre: 100,
    odometer: 8100,
    paidByPartner: partnerA._id,
    fuelStation: 'Indian Oil, South Ext.',
    notes: 'Handover tank full',
    expenseId: expensePetrol._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10002',
    date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    type: 'expense',
    amount: 600,
    description: 'PETROL: Petrol top-up before trip handover (6 Litres)',
    bike: bikeHunter._id,
    paidByPartner: partnerA._id,
    paymentMethod: 'upi',
    relatedId: expensePetrol._id,
    relatedModel: 'Expense',
    balanceImpact: 'debit'
  });

  // Prompt Scenario Expense 2: Service ₹1,500 Paid by Partner B (Vikram)
  const expenseService = await Expense.create({
    expenseNumber: 'TX-EXP-1002',
    bike: bikeClassic._id,
    category: 'service',
    amount: 1500,
    expenseDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    paidByPartner: partnerB._id,
    paymentMethod: 'upi',
    description: 'General 14,000 km periodic service & brake pad check',
    odometer: 14000,
    createdBy: userB._id
  });

  await Maintenance.create({
    bike: bikeClassic._id,
    serviceDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    serviceType: 'routine',
    odometer: 14000,
    cost: 1500,
    paidByPartner: partnerB._id,
    garage: 'SpeedMoto Royal Enfield Authorized Care',
    description: 'Oil top-up, air filter clean, brake pads inspection',
    nextServiceOdo: 15000,
    nextServiceDate: new Date('2027-01-15'),
    invoiceNumber: 'SM-2026-981',
    expenseId: expenseService._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10003',
    date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    type: 'expense',
    amount: 1500,
    description: 'SERVICE: General 14,000 km periodic service & brake pad check',
    bike: bikeClassic._id,
    paidByPartner: partnerB._id,
    paymentMethod: 'upi',
    relatedId: expenseService._id,
    relatedModel: 'Expense',
    balanceImpact: 'debit'
  });

  // Additional Completed & Active Rentals for Rich Analytics:
  // Rental 2: Classic 350 - Active rental by Ananya Deshmukh (3 days @ 1000 = ₹3000, fully paid to Partner B)
  const rental2 = await Rental.create({
    rentalNumber: 'TX-R-1002',
    bike: bikeClassic._id,
    customer: customers[1]._id,
    startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    expectedEndDate: tomorrow,
    dailyRate: 1000,
    totalDays: 3,
    securityDeposit: 3000,
    totalAmount: 3000,
    amountPaid: 3000,
    remainingAmount: 0,
    status: 'active',
    paymentStatus: 'paid',
    startOdometer: 14050,
    createdBy: userB._id
  });

  const payment2 = await Payment.create({
    receiptNumber: 'TX-PAY-1002',
    rental: rental2._id,
    customer: customers[1]._id,
    amount: 3000,
    paymentDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    paymentMethod: 'upi',
    receivedByPartner: partnerB._id,
    transactionReference: 'UPI/981273948192',
    notes: 'Full payment received',
    createdBy: userB._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10004',
    date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    type: 'customer_payment',
    amount: 3000,
    description: `Rental payment received for #TX-R-1002 (Ananya Deshmukh)`,
    bike: bikeClassic._id,
    receivedByPartner: partnerB._id,
    customer: customers[1]._id,
    paymentMethod: 'upi',
    relatedId: payment2._id,
    relatedModel: 'Payment',
    balanceImpact: 'credit'
  });

  // Rental 3: Himalayan 450 - Completed rental by Rohan Mehra (5 days @ 1400 = ₹7000, fully paid, collected by Partner A)
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

  const rental3 = await Rental.create({
    rentalNumber: 'TX-R-1003',
    bike: bikeHimalayan._id,
    customer: customers[2]._id,
    startDate: tenDaysAgo,
    expectedEndDate: fiveDaysAgo,
    actualEndDate: fiveDaysAgo,
    dailyRate: 1400,
    totalDays: 5,
    securityDeposit: 5000,
    totalAmount: 7000,
    amountPaid: 7000,
    remainingAmount: 0,
    status: 'returned',
    paymentStatus: 'paid',
    startOdometer: 10900,
    endOdometer: 11800,
    createdBy: userA._id
  });

  const payment3 = await Payment.create({
    receiptNumber: 'TX-PAY-1003',
    rental: rental3._id,
    customer: customers[2]._id,
    amount: 7000,
    paymentDate: tenDaysAgo,
    paymentMethod: 'bank_transfer',
    receivedByPartner: partnerA._id,
    transactionReference: 'IMPS/HDFC/20261108',
    notes: 'Pre-paid Manali Expedition booking',
    createdBy: userA._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10005',
    date: tenDaysAgo,
    type: 'customer_payment',
    amount: 7000,
    description: `Rental payment received for #TX-R-1003 (Rohan Mehra)`,
    bike: bikeHimalayan._id,
    receivedByPartner: partnerA._id,
    customer: customers[2]._id,
    paymentMethod: 'bank_transfer',
    relatedId: payment3._id,
    relatedModel: 'Payment',
    balanceImpact: 'credit'
  });

  // Rental 4: Classic 350 - Completed rental by Kavita Singh (4 days @ 1000 = ₹4000, paid in cash to Partner B)
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
  const elevenDaysAgo = new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000);

  const rental4 = await Rental.create({
    rentalNumber: 'TX-R-1004',
    bike: bikeClassic._id,
    customer: customers[3]._id,
    startDate: fifteenDaysAgo,
    expectedEndDate: elevenDaysAgo,
    actualEndDate: elevenDaysAgo,
    dailyRate: 1000,
    totalDays: 4,
    securityDeposit: 3000,
    totalAmount: 4000,
    amountPaid: 4000,
    remainingAmount: 0,
    status: 'returned',
    paymentStatus: 'paid',
    startOdometer: 13600,
    endOdometer: 14000,
    createdBy: userB._id
  });

  const payment4 = await Payment.create({
    receiptNumber: 'TX-PAY-1004',
    rental: rental4._id,
    customer: customers[3]._id,
    amount: 4000,
    paymentDate: fifteenDaysAgo,
    paymentMethod: 'cash',
    receivedByPartner: partnerB._id,
    notes: 'Cash payment received at showroom desk',
    createdBy: userB._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10006',
    date: fifteenDaysAgo,
    type: 'customer_payment',
    amount: 4000,
    description: `Rental payment received for #TX-R-1004 (Kavita Singh)`,
    bike: bikeClassic._id,
    receivedByPartner: partnerB._id,
    customer: customers[3]._id,
    paymentMethod: 'cash',
    relatedId: payment4._id,
    relatedModel: 'Payment',
    balanceImpact: 'credit'
  });

  // Add more expenses to illustrate fuel, tyres, insurance
  const expenseTyre = await Expense.create({
    expenseNumber: 'TX-EXP-1003',
    bike: bikeHunter._id,
    category: 'tyres',
    amount: 3200,
    expenseDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    paidByPartner: partnerA._id,
    paymentMethod: 'card',
    description: 'Rear Ceat Zoom Cruz tyre replacement',
    odometer: 7900,
    createdBy: userA._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10007',
    date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    type: 'expense',
    amount: 3200,
    description: 'TYRES: Rear Ceat Zoom Cruz tyre replacement',
    bike: bikeHunter._id,
    paidByPartner: partnerA._id,
    paymentMethod: 'card',
    relatedId: expenseTyre._id,
    relatedModel: 'Expense',
    balanceImpact: 'debit'
  });

  const expenseInsurance = await Expense.create({
    expenseNumber: 'TX-EXP-1004',
    bike: bikeHimalayan._id,
    category: 'insurance',
    amount: 4200,
    expenseDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    paidByPartner: partnerB._id,
    paymentMethod: 'bank_transfer',
    description: 'Comprehensive annual zero-dep insurance renewal with roadside assistance',
    createdBy: userB._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10008',
    date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    type: 'expense',
    amount: 4200,
    description: 'INSURANCE: Comprehensive annual zero-dep insurance renewal',
    bike: bikeHimalayan._id,
    paidByPartner: partnerB._id,
    paymentMethod: 'bank_transfer',
    relatedId: expenseInsurance._id,
    relatedModel: 'Expense',
    balanceImpact: 'debit'
  });

  // Additional fuel entry for Himalayan
  const expenseHimalayanFuel = await Expense.create({
    expenseNumber: 'TX-EXP-1005',
    bike: bikeHimalayan._id,
    category: 'petrol',
    amount: 1200,
    expenseDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
    paidByPartner: partnerA._id,
    paymentMethod: 'upi',
    description: 'Full tank fuel top-up for Himalayan (12 Litres)',
    odometer: 10900,
    createdBy: userA._id
  });

  await FuelEntry.create({
    bike: bikeHimalayan._id,
    date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
    litres: 12,
    amount: 1200,
    pricePerLitre: 100,
    odometer: 10900,
    paidByPartner: partnerA._id,
    fuelStation: 'HP Petrol Pump, NH44',
    notes: 'Tour prep',
    expenseId: expenseHimalayanFuel._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10009',
    date: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
    type: 'expense',
    amount: 1200,
    description: 'PETROL: Full tank fuel top-up for Himalayan (12 Litres)',
    bike: bikeHimalayan._id,
    paidByPartner: partnerA._id,
    paymentMethod: 'upi',
    relatedId: expenseHimalayanFuel._id,
    relatedModel: 'Expense',
    balanceImpact: 'debit'
  });

  // Historical Settlement to demonstrate settled state
  const settlement1 = await Settlement.create({
    settlementNumber: 'TX-SET-1001',
    settlementDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    senderPartner: partnerB._id,
    receiverPartner: partnerA._id,
    amount: 1500,
    paymentMethod: 'upi',
    reference: 'UPI/SETTLE/78129038',
    notes: 'Weekly rental income rebalancing',
    status: 'completed',
    settledBy: userA._id
  });

  await Transaction.create({
    transactionNumber: 'TXN-10010',
    date: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    type: 'partner_settlement',
    amount: 1500,
    description: `Settlement: Vikram Malhotra paid Ayush Sharma ₹1,500`,
    paidByPartner: partnerB._id,
    receivedByPartner: partnerA._id,
    paymentMethod: 'upi',
    relatedId: settlement1._id,
    relatedModel: 'Settlement',
    balanceImpact: 'neutral'
  });

  // Audit Logs
  await AuditLog.create([
    {
      action: 'SYSTEM_INITIALIZED',
      entityType: 'System',
      userName: 'Ayush Sharma',
      details: 'THROTTLEX Rental Management System initialized with 3 bikes and 2 partners.'
    },
    {
      action: 'PAYMENT_RECEIVED',
      entityType: 'Payment',
      userName: 'Ayush Sharma',
      details: '₹2,000 advance payment received for rental #TX-R-1001 via UPI.'
    },
    {
      action: 'EXPENSE_ADDED',
      entityType: 'Expense',
      userName: 'Vikram Malhotra',
      details: '₹1,500 service expense logged for Classic 350 at SpeedMoto.'
    }
  ]);

  console.log('[Seed] Database successfully seeded with rich demo dataset!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[Seed] Error during seeding:', err);
  process.exit(1);
});
