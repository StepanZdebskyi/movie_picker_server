FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install --production

# Copy source code
COPY . .

# Expose the port your app runs on (Change 3000 if needed)
EXPOSE 5000

# Start the server
CMD ["node", "index.js"]