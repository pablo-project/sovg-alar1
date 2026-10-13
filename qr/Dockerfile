# Node.js production image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm install --legacy-peer-deps

# Copy application files
COPY . .

# Build Vite frontend assets
RUN npm run build

# Expose port (Render sets PORT env variable, defaults to 3000)
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start server
CMD ["npm", "start"]
