# STAGE 1: Install Dependencies
FROM node:18-alpine as deps

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production dependencies (clean and small)
RUN npm ci --omit=dev


# STAGE 2: Run the Application
FROM node:18-alpine as runner

WORKDIR /app

# 1. Security: Create the non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 2. Copy the application source code from your computer
COPY --chown=nodejs:nodejs . .

# SAFETY NET: Force delete any Windows node_modules copied in Step 2
# This ensures no Windows .exe files remain, even if .dockerignore is missing
RUN rm -rf node_modules

# 3. Copy the clean production dependencies from Stage 1
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# 4. Switch to non-root user
USER nodejs

EXPOSE 5000

CMD ["npm", "start"]