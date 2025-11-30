const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getUser, getWatchlist, updateWatchlist, seedDatabase } = require('s3Service');

const app = express();
const PORT = 5000; // The server will run on port 5000

app.use(cors()); // Allow requests from React
app.use(bodyParser.json());

// --- HEALTH CHECKS ---

// Health Check endpoint for AWS ALB
app.get('/', (req, res) => {
  res.status(200).send('Healthy');
});

// Health Check endpoint for AWS ALB (alternative path)
app.get('/api/', (req, res) => {
  res.status(200).send('Healthy');
});

// Target Group specific health check
app.get('/health', (req, res) => {
  res.status(200).send('Healthy');
});

// --- API ROUTES (S3 INTEGRATION) ---

// LOGIN ROUTE
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUser(email);

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
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// UPDATE WATCHLIST
app.post('/api/watchlist', async (req, res) => {
  const { email, watchlist } = req.body;

  try {
    const updatedList = await updateWatchlist(email, watchlist);

    if (updatedList) {
      console.log(`Updated watchlist for ${email}. Items: ${updatedList.length}`);
      res.status(200).json({
        success: true,
        message: 'Watchlist updated successfully',
        watchlist: updatedList,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    console.error('Watchlist Update Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET WATCHLIST
app.get('/api/watchlist/:email', async (req, res) => {
  const { email } = req.params;

  try {
    const watchlist = await getWatchlist(email);

    if (watchlist !== null) {
      res.status(200).json({
        success: true,
        watchlist: watchlist,
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
  } catch (error) {
    console.error('Watchlist Fetch Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Seed the S3 bucket with mock users (Admin/Test) on startup
  try {
    await seedDatabase();
  } catch (err) {
    console.error('Failed to seed database:', err);
  }
});
