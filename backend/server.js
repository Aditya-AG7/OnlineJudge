const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const compileRoutes = require('./routes/compileRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const formatRoutes = require('./routes/formatRoutes');
const { requireAuth, requireRole } = require('./middleware/auth');

const { getAllUsers, updateUserRole } = require('./controllers/adminController');

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

connectDB();

app.use('/', authRoutes);
app.use('/', problemRoutes);
app.use('/', compileRoutes);
app.use('/', submissionRoutes);
app.use('/', formatRoutes);

app.get('/profile', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are logged in as ${req.user.type}` });
});

// Admin User Management Routes
app.get('/admin/users', requireAuth, requireRole('admin'), getAllUsers);
app.patch('/admin/users/:id/role', requireAuth, requireRole('admin'), updateUserRole);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));