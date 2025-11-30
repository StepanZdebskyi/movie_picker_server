const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

// The SDK automatically picks up credentials from the ECS Task Role
const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'stepan-movie-app-data';

// MOCK USER DATABASE STRUCTURE
const MOCK_USERS = [
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

// Helper to stream S3 body to string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

async function getUser(email) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `users/${email}.json`,
    });
    const response = await client.send(command);
    const body = await streamToString(response.Body);
    return JSON.parse(body);
  } catch (err) {
    if (err.name === 'NoSuchKey') return null; // User doesn't exist
    throw err;
  }
}

async function saveUser(email, data) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: `users/${email}.json`,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  });
  await client.send(command);
}

// New method for GET /api/watchlist/:email
async function getWatchlist(email) {
  const user = await getUser(email);
  if (!user) return null; // Let the controller handle 404
  return user.watchlist || [];
}

// New method for POST /api/watchlist
async function updateWatchlist(email, newWatchlist) {
  const user = await getUser(email);
  if (!user) return null; // User not found

  user.watchlist = newWatchlist;
  await saveUser(email, user);

  return user.watchlist;
}

// SEED FUNCTION: Call this on server startup
async function seedDatabase() {
  console.log('Checking S3 for seed data...');
  for (const user of MOCK_USERS) {
    try {
      // Check if user exists first to avoid overwriting changes made by the user
      const existing = await getUser(user.email);
      if (!existing) {
        console.log(`Seeding initial user: ${user.email}`);
        await saveUser(user.email, user);
      }
    } catch (err) {
      console.error(`Error seeding user ${user.email}:`, err);
    }
  }
}

module.exports = { getUser, saveUser, getWatchlist, updateWatchlist, seedDatabase };
