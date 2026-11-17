const Settings = require('../models/Settings');
const ledgerService = require('../services/ledgerService');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return res.json({ settings });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving settings.' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    Object.assign(settings, req.body);
    await settings.save();

    await ledgerService.recordAudit({
      action: 'SETTINGS_UPDATED',
      entityType: 'Settings',
      entityId: settings._id,
      userId: req.user?._id,
      userName: req.user?.name || 'Admin',
      details: 'Updated business settings and fee structures.'
    });

    return res.json({ message: 'Settings saved successfully.', settings });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating settings.' });
  }
};
