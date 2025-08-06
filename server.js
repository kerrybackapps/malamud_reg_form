const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

app.get('/api/registrations', async (req, res) => {
  try {
    const registrationsPath = path.join(__dirname, 'registrations.json');
    const data = await fs.readFile(registrationsPath, 'utf8');
    const registrations = JSON.parse(data);
    res.json(registrations);
  } catch (error) {
    res.json([]);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});