const express = require('express');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
app.use(express.json());

connectDB();

app.use('/', authRoutes);

app.get('/profile', requireAuth, (req, res) => {
  res.json({ message: `Hello ${req.user.username}, you are logged in as ${req.user.type}` });
});

app.get('/admin/users', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ message: 'Welcome admin - user list would go here' });
});

app.post('/problems', requireAuth, requireRole('problem_setter', 'admin'), (req, res) => {
  res.json({ message: 'Problem creation would go here' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));