const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SALT_ROUNDS = 10;

// POST /register
async function register(req, res) {
  try {
    const { full_name, username, email, password, type } = req.body;

    if (!full_name || !username || !email || !password) {
      return res.status(400).json({ error: 'full_name, username, email, and password are all required' });
    }
    
    const userType = 'user';

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await User.create({
      full_name,
      username,
      email,
      password_hash,
      type: userType,
    });

    const token = generateToken(newUser);

    const safeUser = {
      id: newUser._id,
      full_name: newUser.full_name,
      username: newUser.username,
      email: newUser.email,
      type: newUser.type,
      created_at: newUser.created_at,
    };

    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Something went wrong during registration' });
  }
}

// POST /login
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    const safeUser = {
      id: user._id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      type: user.type,
      created_at: user.created_at,
    };

    return res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong during login' });
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username, type: user.type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

module.exports = { register, login };