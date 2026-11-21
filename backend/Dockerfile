# 1. Use the official lightweight Node.js 22 Alpine image
FROM node:22-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy package files first (Docker caches this layer if packages haven't changed)
COPY package*.json ./

# 4. Install production dependencies
RUN npm install --omit=dev

# 5. Copy the rest of the backend source code
COPY . .

# 6. Expose port 4500
EXPOSE 4500

# 7. Start the server
CMD ["node", "server.js"]
