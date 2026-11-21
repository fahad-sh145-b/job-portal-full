# 1. Official lightweight Node.js 22 Alpine image
FROM node:22-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first
COPY package*.json ./

# 4. Install production dependencies
RUN npm install --omit=dev

# 5. Copy microservice source code
COPY . .

# 6. Expose port 5001
EXPOSE 5001

# 7. Start microservice
CMD ["node", "server.js"]
