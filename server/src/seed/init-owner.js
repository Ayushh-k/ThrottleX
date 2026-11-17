const { connectDB } = require('../config/db');
const User = require('../models/User');
const Partner = require('../models/Partner');

async function initOwner() {
  await connectDB();
  console.log('[THROTTLEX] Initializing Owner Account...');

  const email = 'ayushkamboj9690@gmail.com';
  const name = 'Ayush kamboj';
  const phone = '9690259628';
  const password = 'ayush@tx123';

  // Check if owner already exists
  let user = await User.findOne({ email });
  let partner = await Partner.findOne({ email });

  if (!partner) {
    partner = await Partner.create({
      name,
      email,
      phone,
      sharePercentage: 50,
      status: 'active',
      notes: 'Owner / Managing Partner'
    });
    console.log('[THROTTLEX] Partner profile created for', name);
  }

  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'owner',
      partnerId: partner._id
    });
    partner.userId = user._id;
    await partner.save();
    console.log('[THROTTLEX] Owner User account created successfully.');
  } else {
    // Update password and partner link if already existed
    user.name = name;
    user.phone = phone;
    user.role = 'owner';
    user.password = password; // Will trigger bcrypt hash in pre('save')
    user.partnerId = partner._id;
    await user.save();
    console.log('[THROTTLEX] Existing Owner User updated with new credentials.');
  }

  console.log(`===============================================`);
  console.log(`  Owner Account Ready:`);
  console.log(`  Name:     ${name}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Phone:    ${phone}`);
  console.log(`  Role:     owner`);
  console.log(`===============================================`);
  process.exit(0);
}

initOwner().catch((err) => {
  console.error('[THROTTLEX] Error initializing owner:', err);
  process.exit(1);
});
