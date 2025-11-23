const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000; // The server will run on port 5000

app.use(cors()); // Allow requests from React
app.use(bodyParser.json());

// MOCK USER DATABASE
const users = [
  {
    email: 'admin@movies.com',
    password: 'password123',
    name: 'Admin User',
    watchlist: [],
  },
  {
    email: 'user@test.com',
    password: '1234',
    name: 'Test User',
    watchlist: [],
  },
];

// LOGIN ROUTE
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);

  if (user && user.password === password) {
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        name: user.name,
        email: user.email,
        watchlist: user.watchlist,
      },
    });
  } else {
    // Failure
    res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }
});

app.post('/watchlist', (req, res) => {
  const { email, watchlist } = req.body;

  const user = users.find((u) => u.email === email);

  if (user) {
    user.watchlist = watchlist;

    console.log(`Updated watchlist for ${user.name}. Items: ${user.watchlist.length}`);

    res.status(200).json({
      success: true,
      message: 'Watchlist updated successfully',
      watchlist: user.watchlist,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
});

app.get('/watchlist/:email', (req, res) => {
  const { email } = req.params;

  const user = users.find((u) => u.email === email);

  if (user) {
    res.status(200).json({
      success: true,
      watchlist: user.watchlist,
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
