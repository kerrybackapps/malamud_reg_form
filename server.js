const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Admin credentials from environment
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'changeme123', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure CORS for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://' + process.env.KOYEB_PUBLIC_DOMAIN] 
    : true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/register', async (req, res) => {
  try {
    const { name, department, role, email } = req.body;
    
    if (!name || !department || !role || !email) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const registration = {
      name,
      department,
      role,
      email,
      timestamp: new Date().toISOString()
    };
    
    const registrationsPath = path.join(__dirname, 'registrations.json');
    let registrations = [];
    
    try {
      const data = await fs.readFile(registrationsPath, 'utf8');
      registrations = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, that's okay
    }
    
    registrations.push(registration);
    await fs.writeFile(registrationsPath, JSON.stringify(registrations, null, 2));
    
    res.json({ success: true, message: 'Registration successful!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to process registration' });
  }
});

// Admin login endpoint
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    // Check credentials
    if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Set cookie
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    
    res.json({ success: true, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin logout endpoint
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

// Protected endpoint to get registrations
app.get('/api/admin/registrations', authenticateToken, async (req, res) => {
  try {
    const registrationsPath = path.join(__dirname, 'registrations.json');
    const data = await fs.readFile(registrationsPath, 'utf8');
    const registrations = JSON.parse(data);
    res.json(registrations);
  } catch (error) {
    res.json([]);
  }
});

// Protected endpoint to download registrations as CSV
app.get('/api/admin/registrations/download', authenticateToken, async (req, res) => {
  try {
    const registrationsPath = path.join(__dirname, 'registrations.json');
    const data = await fs.readFile(registrationsPath, 'utf8');
    const registrations = JSON.parse(data);
    
    // Convert to CSV
    const headers = ['Name', 'Email', 'Department', 'Role', 'Timestamp'];
    const csvRows = [headers.join(',')];
    
    registrations.forEach(reg => {
      const values = [
        `"${reg.name || ''}"`,
        `"${reg.email || ''}"`,
        `"${reg.department || ''}"`,
        `"${reg.role || ''}"`,
        `"${reg.timestamp || ''}"`
      ];
      csvRows.push(values.join(','));
    });
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download registrations' });
  }
});

// Check auth status
app.get('/api/admin/auth/check', authenticateToken, (req, res) => {
  res.json({ authenticated: true, username: req.user.username });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});