# ✦ Fly.io Docker Build Error Fix Guide ✦

## **Error: `npm ci --only=production` failed**

This error occurs when Docker can't install your Node.js dependencies. Here are the solutions:

---

## **🔧 Solution 1: Use Updated Dockerfile (Recommended)**

The main `Dockerfile` has been updated to fix this issue:

```dockerfile
# Dockerfile for Fly.io deployment
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force
RUN npm install --production --no-audit --no-fund

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S astraee -u 1001

# Change ownership of app directory
RUN chown -R astraee:nodejs /app
USER astraee

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
```

**Key changes:**
- ✅ Added build dependencies (`python3`, `make`, `g++`)
- ✅ Clean npm cache before install
- ✅ Use `npm install` instead of `npm ci`
- ✅ Added `--no-audit --no-fund` flags

---

## **🔧 Solution 2: Use Alternative Dockerfile**

If the main Dockerfile still fails, use `Dockerfile.alternative`:

```bash
# Rename the alternative Dockerfile
mv Dockerfile.alternative Dockerfile
```

---

## **🔧 Solution 3: Manual Fix Steps**

### **Step 1: Clean Local Environment**
```bash
# Clean npm cache
npm cache clean --force

# Remove package-lock.json
rm package-lock.json

# Reinstall dependencies
npm install
```

### **Step 2: Test Local Build**
```bash
# Test if dependencies install correctly
npm install --production
```

### **Step 3: Deploy to Fly.io**
```bash
# Deploy with the fixed Dockerfile
fly deploy
```

---

## **🔧 Solution 4: Use Different Base Image**

If Alpine Linux is causing issues, try using the standard Node.js image:

```dockerfile
# Dockerfile with standard Node.js image
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production --no-audit --no-fund

# Copy application code
COPY . .

# Create non-root user
RUN groupadd -r astraee && useradd -r -g astraee astraee
RUN chown -R astraee:astraee /app
USER astraee

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

---

## **🔧 Solution 5: Debug the Build**

### **Enable Verbose Logging:**
```bash
# Deploy with verbose output
fly deploy --verbose
```

### **Check Build Logs:**
```bash
# View detailed logs
fly logs --verbose
```

### **Test Docker Build Locally:**
```bash
# Build Docker image locally to test
docker build -t astraee-bot .
```

---

## **🔧 Solution 6: Simplify Dependencies**

If the issue persists, temporarily simplify your `package.json`:

```json
{
  "name": "astraee-discord-bot",
  "version": "1.0.0",
  "description": "Elegant Discord bot for IMVU modeling agencies",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "discord.js": "^14.22.1",
    "express": "^4.18.2",
    "node-cron": "^3.0.3",
    "pg": "^8.11.3"
  }
}
```

Then add other dependencies one by one after successful deployment.

---

## **🔧 Solution 7: Use Fly.io's Buildpacks**

Instead of Dockerfile, use Fly.io's Node.js buildpack:

### **Remove Dockerfile:**
```bash
rm Dockerfile
```

### **Update fly.toml:**
```toml
# fly.toml
app = "astraee-discord-bot"
primary_region = "iad"

[build]

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 768
```

### **Deploy:**
```bash
fly deploy
```

---

## **🔧 Solution 8: Check for Specific Issues**

### **Common Causes:**
1. **Native dependencies** requiring compilation
2. **Package-lock.json** corruption
3. **Node.js version** incompatibility
4. **Alpine Linux** missing build tools
5. **Memory limits** during build

### **Check Dependencies:**
```bash
# Check for native dependencies
npm list --depth=0

# Check for problematic packages
npm audit
```

---

## **🔧 Solution 9: Use Multi-stage Build**

For complex dependencies:

```dockerfile
# Multi-stage Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm install

# Copy source code
COPY . .

# Build application (if needed)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit --no-fund

# Copy built application
COPY --from=builder /app .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S astraee -u 1001
RUN chown -R astraee:nodejs /app
USER astraee

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

---

## **🔧 Solution 10: Contact Support**

If all else fails:

1. **Check Fly.io Status**: [status.fly.io](https://status.fly.io)
2. **Join Fly.io Discord**: [discord.gg/flyio](https://discord.gg/flyio)
3. **Check Documentation**: [fly.io/docs](https://fly.io/docs)

---

## **🎯 Recommended Order of Solutions:**

1. ✅ **Use updated Dockerfile** (Solution 1)
2. ✅ **Clean local environment** (Solution 3)
3. ✅ **Use alternative Dockerfile** (Solution 2)
4. ✅ **Use standard Node.js image** (Solution 4)
5. ✅ **Use buildpacks** (Solution 7)
6. ✅ **Simplify dependencies** (Solution 6)
7. ✅ **Use multi-stage build** (Solution 9)

---

## **🔍 Debugging Commands:**

```bash
# Check Fly.io status
fly status

# View logs
fly logs

# Check app info
fly info

# Restart app
fly apps restart astraee-discord-bot

# Scale app
fly scale count 1

# Check secrets
fly secrets list
```

---

**Try Solution 1 first - it should fix your Docker build error!** ✦
