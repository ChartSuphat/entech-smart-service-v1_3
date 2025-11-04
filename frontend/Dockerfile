FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with npm ci (faster, more reliable for CI/CD)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install serve to run the built app
RUN npm install -g serve

EXPOSE 5050

# Serve the built app on port 5050
CMD ["serve", "-s", "dist", "-l", "5050", "--no-clipboard"]