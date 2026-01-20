const express = require('express');
const router = express.Router();
const { getAllEmails, addEmail, removeEmail } = require('../controllers/allowedEmail.controller');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware, getAllEmails);
router.post('/', authMiddleware, addEmail);
router.delete('/:id', authMiddleware, removeEmail);

module.exports = router;
