const User = require('../models/User');

// GET /admin/users - Get all registered users (Admin only)
async function getAllUsers(req, res) {
  try {
    const users = await User.find({}, '-password_hash').sort({ created_at: -1 });
    
    const safeUsers = users.map(user => ({
      id: user._id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      type: user.type,
      created_at: user.created_at,
    }));

    return res.status(200).json({ users: safeUsers });
  } catch (err) {
    console.error('Admin getAllUsers error:', err);
    return res.status(500).json({ error: 'Failed to fetch users list' });
  }
}

// PATCH /admin/users/:id/role - Promote/Change user role (Admin only)
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { type } = req.body;

    const allowedTypes = ['user', 'problem_setter', 'admin'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid user type. Allowed: user, problem_setter, admin' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { type },
      { new: true }
    ).select('-password_hash');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const safeUser = {
      id: updatedUser._id,
      full_name: updatedUser.full_name,
      username: updatedUser.username,
      email: updatedUser.email,
      type: updatedUser.type,
      created_at: updatedUser.created_at,
    };

    return res.status(200).json({ message: `User role updated to ${type}`, user: safeUser });
  } catch (err) {
    console.error('Admin updateUserRole error:', err);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
}

module.exports = { getAllUsers, updateUserRole };
