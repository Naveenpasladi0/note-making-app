const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Paths to JSON files
const USERS_FILE = 'users.json';
const NOTES_FILE = 'notes.json';

// Helper: Get all users
function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

// Helper: Get all notes
function getNotes() {
  if (!fs.existsSync(NOTES_FILE)) return [];
  const data = fs.readFileSync(NOTES_FILE);
  return JSON.parse(data);
}

// Helper: Save notes
function saveNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2));
}

// ==============================
// 📌 API Routes
// ==============================

// Register
app.post('/api/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  const users = getUsers();

  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const newUser = { name, email, password };
  users.push(newUser);

  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.status(200).json({ message: 'Registration successful!' });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = getUsers();

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  res.json({ message: 'Login successful!' });
});

// Save all notes for a user
// Save or update a single note
app.post('/api/notes', (req, res) => {
  const { id, email, title, content, media, pinned, timestamp } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required.' });

  let notes = getNotes();

  const updatedNote = {
    id,
    email,
    title,
    content,
    media: media || '',
    pinned: pinned || false,
    timestamp: timestamp || Date.now()
  };

  const existingIndex = notes.findIndex(n => n.id === id && n.email === email);

  if (existingIndex !== -1) {
    notes[existingIndex] = updatedNote;
  } else {
    notes.push(updatedNote);
  }

  saveNotes(notes);
  console.log("✅ Note saved for:", email);
  res.status(201).json({ message: 'Note saved.' });
});

// Delete specific note
app.post('/api/notes/delete', (req, res) => {
  const { id, email } = req.body;
  if (!id || !email) {
    return res.status(400).json({ error: 'Missing ID or email.' });
  }

  let notes = getNotes();
  notes = notes.filter(n => !(n.id === id && n.email === email));
  saveNotes(notes);

  console.log("🗑️ Note deleted:", id);
  res.json({ message: 'Note deleted successfully.' });
});

// Get notes for specific user
app.get('/api/notes', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'User email is required.' });
  }
  const notes = getNotes();
  const userNotes = notes.filter(note => note.email === email);
  res.json(userNotes);
});

// ==============================
// 📄 HTML Routes
// ==============================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// ==============================
// 🚀 Start the server
// ==============================
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});