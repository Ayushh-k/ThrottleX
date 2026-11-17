const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate('partnerId');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        partnerId: user.partnerId?._id || null,
        partnerName: user.partnerId?.name || null
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    // Check if partner profile exists or create one
    let partner = await Partner.findOne({ email: email.toLowerCase().trim() });
    if (!partner) {
      partner = await Partner.create({
        name,
        email: email.toLowerCase().trim(),
        phone: phone || '',
        sharePercentage: 50
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'partner',
      phone: phone || '',
      partnerId: partner._id
    });

    partner.userId = user._id;
    await partner.save();

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        partnerId: partner._id,
        partnerName: partner.name
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('partnerId');
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving user profile.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, password } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (password) user.password = password;

    await user.save();

    if (user.partnerId) {
      await Partner.findByIdAndUpdate(user.partnerId, {
        name: user.name,
        phone: user.phone,
        avatar: user.avatar
      });
    }

    return res.json({
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating profile.' });
  }
};
