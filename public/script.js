// Login route
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    const users = getUsers();
  
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
  
    // Simulate session for now
    res.json({ message: `Welcome, ${user.name}!` });
  });