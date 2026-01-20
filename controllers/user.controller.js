// controllers/userController.js
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;


  try {
    // Check if user exists by Email
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Check if user exists by Email
    const existingUserByname = await User.findOne({ name });
    if (existingUserByname) return res.status(400).json({ message: 'Change Your Username, and try again' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const allUsers = await User.find();

    let user;
    if (allUsers.length === 0) {
      // Create admin
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        statusaccess: 'approved',
      });
    } else {

      // Create user
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        permissions: ['Dashboard', 'MyInfo']
      });
    }


    res.status(201).json({ message: 'User registered', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Pending Status Users
const getrequest = async (req, res) => {
  try {
    const requests = await User.find({ statusaccess: 'pending' });
    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Error to Fetch Requests', error: err.message });
  }
};

// Get Denied Status Users
const getdeniedrequest = async (req, res) => {
  try {
    const user = await User.find({ role: 'user' });
    if (user) {
      const requests = await User.find({
        statusaccess: 'denied',
        role: { $ne: 'admin' }
      });
      res.status(200).json({ requests });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error to Fetch Requests', error: err.message });
  }
};

// Get Approved Status Users
const getapprovedrequest = async (req, res) => {
  try {
    const requests = await User.find({
      statusaccess: 'approved',
      role: { $ne: 'admin' }
    });
    res.status(200).json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Error to Fetch Requests', error: err.message });
  }
};

const allowUser = async (req, res) => {
  try {
    const { Id, status } = req.body;

    const user = await User.findByIdAndUpdate(Id, { statusaccess: status }, { new: true });

    if (user) {
      res.status(200).json({ message: `User status ${status} successfully` });
    }

  } catch (err) {
    res.status(500).json({ 'User status not updated': err.message })
  };
}

// Login user
const loginUser = async (req, res) => {
  const { name, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ name });
    if (!user) return res.status(400).json({ message: 'Incorrect email or password' });

    if (user.role === 'user') {
      if (user.statusaccess === 'denied') return res.status(400).json({ message: 'Your account has been denied' });
      if (user.statusaccess === 'pending') return res.status(400).json({ message: 'Your account has been pending' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Incorrect email or password' });

    // Create token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Remove password before sending user data
    const { password: _, ...userData } = user.toObject();

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send response
    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'Strict',
      secure: process.env.NODE_ENV === 'production',
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserByEmail = async (req, res) => {
  try {
    const email = req.query;
    const user = await User.findOne(email).select('-password');
    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ message: 'Failed to Fetch User', error: err.message })
  }
}
// Get admin users
const getAdmin = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.body.username });

    if (!user) {
      return res.status(404).json({ message: "User not found" }); // ✅ use return
    }

    return res.status(200).json(user.role); // or { role: user.role }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// Get admin for Wrapper
const getAdminWrapper = async (req, res) => {
  try {
    const { username } = req.body;

    const admin = await User.findOne({ name: username }).select('-password');

    if (!admin) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (admin.role === 'admin') {
      return res.status(200).json({ role: 'admin' });
    }

    return res.status(200).json({ role: 'user', permissions: admin.permissions || [] });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('-password');

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete User
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await User.findByIdAndDelete(id);

    res.status(200).json({ message: 'User deleted successfully' })

  } catch (err) {
    res.status(500).json({ message: 'Failed to Delete User' })

  }
};

// User Page Access
const userAccess = async (req, res) => {
  const { username } = req.params;
  const { pages } = req.body;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { name: username }, // adjust field name as needed
      { permissions: pages }, // don't wrap in [ ] unless pages is a single item
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Permissions updated', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update user' });
  }

}

// Check Permissions
const checkPermissions = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ name: username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const filteredPermissions = (user.permissions || []).filter(
      (perm) => perm !== 'Dashboard' && perm !== 'MyInfo'
    );

    res.status(200).json({
      message: 'Access Granted Successfully',
      permissions: filteredPermissions,
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to Fetch Permissions" });
  }
};

// Add User By Admin

const addUser = async (req, res) => {
  try {
    const { name, email, password, statusaccess } = req.body;

    // Basic validation
    if (!name || !email || !password || !statusaccess) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'email already registered' });
    }

    const Username = await User.findOne({ name });
    if (Username) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      statusaccess,
      permissions: ['Dashboard', 'MyInfo']
    });

    if (user) {
      return res.status(200).json({ message: 'User created successfully' });
    }

    res.status(500).json({ message: 'User creation failed' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


// Check LoggedIn User 
const me = async (req, res) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (err) {
    res.status(401).json({ message: ' Failed to Fetch User' })
  }
}

const updateUserDetails = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { id } = req.params;

    if (!username) {
      return res.status(400).json({ message: 'Username is required.' });
    }

    const alreadyexistUsername = await User.findOne({ name: username });

    if (alreadyexistUsername && alreadyexistUsername._id.toString() !== id) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const updateData = { name: username };

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.status(200).json({ message: 'User updated successfully.' });
  } catch (err) {
    console.error('❌ Update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};



module.exports = {
  registerUser,
  loginUser,
  getUserByEmail,
  getUsers,
  getAdmin,
  logoutUser,
  allowUser,
  getrequest,
  getapprovedrequest,
  getdeniedrequest,
  deleteUser,
  userAccess,
  getAdminWrapper,
  checkPermissions,
  me,
  addUser,
  updateUserDetails
};
