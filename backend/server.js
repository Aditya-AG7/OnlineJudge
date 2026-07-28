const express = require('express');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { requireAuth, requireRole } = require('./middleware/auth');

const { getAllUsers, updateUserRole } = require('./controllers/adminController');

const app = express();
app.use(express.json());

connectDB();

app.use('/', authRoutes);

app.get('/profile', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are logged in as ${req.user.type}` });
});

// Admin User Management Routes
app.get('/admin/users', requireAuth, requireRole('admin'), getAllUsers);
app.patch('/admin/users/:id/role', requireAuth, requireRole('admin'), updateUserRole);

app.post('/problems', requireAuth, requireRole('problem_setter', 'admin'), (req, res) => {
  res.json({ message: 'Problem creation would go here' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));