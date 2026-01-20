const express = require('express');
const router = express.Router();
const { getAllEmails, addEmail, removeEmail } = require('../controllers/allowedEmail.controller');
// Assuming you have an auth middleware, if not, adjust accordingly. 
// Based on existing code, it seems 'syncImages' uses req.isAuthenticated() or similar.
// I will assuming these routes need to be protected.

// Middleware to check authentication (mock or import from somewhere if exists)
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    // Fallback if req.isAuthenticated is not available or returns false
    // But since this is for admin, we might need stronger check. 
    // For now, let's assume if they can hit this, they are authenticated or we will add middleware in main app
    // Actually, looking at photo.controller.js:45 `if (!req.isAuthenticated())`
    // So we should probably use the same check.
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ message: 'Not authenticated' });
};

router.get('/', isAuthenticated, getAllEmails);
router.post('/', isAuthenticated, addEmail);
router.delete('/:id', isAuthenticated, removeEmail);

module.exports = router;
