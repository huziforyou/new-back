const AllowedEmail = require('../models/AllowedEmail.model');

// Get all allowed emails
const getAllEmails = async (req, res) => {
    try {
        const emails = await AllowedEmail.find().sort({ createdAt: -1 });
        res.status(200).json(emails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emails', error: error.message });
    }
};

// Add a new allowed email
const addEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const newEmail = new AllowedEmail({
            email,
            addedBy: req.user ? req.user.email : 'System'
        });

        await newEmail.save();
        res.status(201).json({ message: 'Email added successfully', email: newEmail });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Error adding email', error: error.message });
    }
};

// Remove an allowed email
const removeEmail = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEmail = await AllowedEmail.findByIdAndDelete(id);

        if (!deletedEmail) {
            return res.status(404).json({ message: 'Email not found' });
        }

        res.status(200).json({ message: 'Email removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing email', error: error.message });
    }
};

module.exports = {
    getAllEmails,
    addEmail,
    removeEmail
};
