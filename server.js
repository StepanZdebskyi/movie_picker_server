const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000; // The server will run on port 5000

const client = require('prom-client');

// 1. Вмикаємо збір стандартних метрик (CPU, RAM, Event Loop)
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 }); // Оновлювати кожні 5 секунд

// 2. Створюємо кастомну метрику (лічильник запитів) - для прикладу
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

// Middleware для вимірювання часу кожного запиту (опціонально, але круто для звіту)
app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
  });
  next();
});

// 3. Створюємо ендпоінт /metrics, який буде читати Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

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
app.post('/api/login', (req, res) => {
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

app.post('/api/watchlist', (req, res) => {
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

app.get('/api/watchlist/:email', (req, res) => {
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
