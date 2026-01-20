

// routes/userRoutes.js
const express = require('express');
const {
  registerUser,
  loginUser,
  getUsers,
  logoutUser,
  getUserByEmail,
  getrequest,
  allowUser,
  getapprovedrequest,
  getdeniedrequest,
  getAdmin,
  deleteUser,
  userAccess,
  getAdminWrapper,
  checkPermissions,
  me,
  addUser,
  updateUserDetails,

} = require('../controllers/user.controller');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

// Register user
router.post('/register', registerUser);

// Get Pending Requests
router.get('/getrequest', getrequest)

// Get Approved Requests
router.get('/approved-request', getapprovedrequest)

// Get Denied Requests
router.get('/denied-request', getdeniedrequest)

// Login user
router.post('/login', loginUser);

// allow or denied User
router.post('/status', allowUser);

// Logout User
router.post('/logout', logoutUser);

// Get User By email
router.get('/getuserbyemail', getUserByEmail)

// Get all users
router.post('/getadmin', getAdmin);

// User Pages Access
router.post('/give-access/:username', userAccess)

// Delete User
router.delete('/delete/:id', deleteUser)

// Get all users
router.get('/', getUsers);

// Get Admin Wrapper
router.post('/getadminwrapper', getAdminWrapper);

// Get User Permissions
router.post('/permissions/:username', checkPermissions);

router.get('/me', authMiddleware, me)

router.post('/userbyadmin', addUser)

router.put('/user/:id', authMiddleware, isAdmin, updateUserDetails);


module.exports = router;
