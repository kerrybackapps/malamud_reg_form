const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Simple password check - just set ADMIN_PASSWORD in environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Public registration endpoint
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

// Simple password-protected endpoint to get registrations
app.post('/api/admin/registrations', async (req, res) => {
  const { password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  try {
    const registrationsPath = path.join(__dirname, 'registrations.json');
    const data = await fs.readFile(registrationsPath, 'utf8');
    const registrations = JSON.parse(data);
    res.json(registrations);
  } catch (error) {
    res.json([]);
  }
});

// Simple password-protected CSV download
app.post('/api/admin/registrations/download', async (req, res) => {
  const { password } = req.body;
  
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});