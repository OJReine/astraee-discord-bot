# ✦ Fly.io Migration Guide ✦
## From Render to Fly.io - Complete Step-by-Step Guide

### **Why Fly.io is Better Than Render:**

| Feature | Render Free | Fly.io Free |
|---------|-------------|-------------|
| **Web Services** | ✅ 750 hours/month | ✅ 3 shared-cpu-1x VMs |
| **Shell Access** | ❌ Paywall | ✅ Always available |
| **Scaling** | ❌ Paywall | ✅ Always available |
| **Disks** | ❌ Paywall | ✅ Always available |
| **Jobs** | ❌ Paywall | ✅ Always available |
| **Custom Domains** | ❌ Paywall | ✅ Always available |
| **Environment Variables** | ✅ Available | ✅ Always available |
| **Logs** | ✅ Available | ✅ Always available |
| **Sleep Prevention** | ❌ Requires UptimeRobot | ✅ Built-in |

---

## ✦ **Fly.io Free Tier Benefits** ✦

- ✅ **3 shared-cpu-1x VMs** (768MB RAM each)
- ✅ **160GB bandwidth/month**
- ✅ **3GB persistent storage**
- ✅ **Always-on** (no sleeping)
- ✅ **Full shell access**
- ✅ **Scaling controls**
- ✅ **Custom domains**
- ✅ **Built-in monitoring**
- ✅ **Global edge locations**

---

## ✦ **Step 1: Install Fly.io CLI** ✦

### **Windows (PowerShell):**
```powershell
# Download and install Fly.io CLI
iwr https://fly.io/install.ps1 -useb | iex
```

### **Alternative (Manual Download):**
1. Go to [fly.io/docs/hands-on/install-flyctl/](https://fly.io/docs/hands-on/install-flyctl/)
2. Download the Windows installer
3. Run the installer
4. Restart your terminal

### **Verify Installation:**
```bash
fly version
```

---

## ✦ **Step 2: Create Fly.io Account** ✦

1. Go to [fly.io](https://fly.io)
2. Click "Sign Up"
3. Sign up with GitHub (same account as your bot)
4. Verify your email
5. Complete account setup

---

## ✦ **Step 3: Login to Fly.io** ✦

```bash
fly auth login
```

This will open your browser to authenticate with Fly.io.

---

## ✦ **Step 4: Create Fly.io App** ✦

### **Initialize Your App:**
```bash
fly launch --no-deploy
```

**Configuration Questions:**
- **App name**: `astraee-discord-bot` (or choose your own)
- **Organization**: Select your personal org
- **Region**: Choose closest to you (e.g., `iad` for US East)
- **Postgres**: `No` (we're using external database)
- **Redis**: `No` (not needed)
- **Deploy**: `No` (we'll configure first)

This creates a `fly.toml` configuration file.

---

## ✦ **Step 5: Configure Your App** ✦

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

### **Create Dockerfile:**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S astraee -u 1001

# Change ownership
RUN chown -R astraee:nodejs /app
USER astraee

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

---

## ✦ **Step 6: Set Environment Variables** ✦

### **Set Discord Token:**
```bash
fly secrets set DISCORD_TOKEN=your_discord_bot_token_here
```

### **Set Database URL:**
```bash
fly secrets set DATABASE_URL=your_external_database_connection_string
```

### **Set Node Environment:**
```bash
fly secrets set NODE_ENV=production
```

### **Set Port:**
```bash
fly secrets set PORT=3000
```

### **Verify Secrets:**
```bash
fly secrets list
```

---

## ✦ **Step 7: Deploy to Fly.io** ✦

### **Deploy Your App:**
```bash
fly deploy
```

### **Monitor Deployment:**
```bash
fly logs
```

### **Check App Status:**
```bash
fly status
```

---

## ✦ **Step 8: Set Up Database** ✦

### **Access Your App Shell:**
```bash
fly ssh console
```

### **Run Database Setup:**
```bash
npm run db:setup
```

### **Exit Shell:**
```bash
exit
```

---

## ✦ **Step 9: Configure Custom Domain (Optional)** ✦

### **Add Domain:**
```bash
fly certs add your-domain.com
```

### **Update DNS:**
1. Go to your domain registrar
2. Add CNAME record: `your-domain.com` → `astraee-discord-bot.fly.dev`
3. Wait for DNS propagation (5-10 minutes)

### **Check Certificate:**
```bash
fly certs show your-domain.com
```

---

## ✦ **Step 10: Set Up Monitoring** ✦

### **View Logs:**
```bash
fly logs
```

### **Monitor Metrics:**
```bash
fly dashboard
```

### **Check App Health:**
```bash
fly status
```

---

## ✦ **Step 11: Set Up Uptime Monitoring** ✦

### **Option 1: UptimeRobot (Free)**
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account
3. Add new monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Astraee Discord Bot
   - **URL**: `https://astraee-discord-bot.fly.dev`
   - **Monitoring Interval**: 5 minutes
   - **Alert Contacts**: Add your email

### **Option 2: Fly.io Built-in Monitoring**
Fly.io has built-in monitoring, but UptimeRobot provides external verification.

---

## ✦ **Step 12: Clean Up Render (Optional)** ✦

If you want to remove your Render deployment:

1. Go to Render dashboard
2. Find your web service
3. Click "Delete" → "Delete Service"
4. Confirm deletion

---

## ✦ **Fly.io Commands Reference** ✦

### **App Management:**
```bash
fly apps list                    # List all apps
fly status                       # Check app status
fly logs                         # View logs
fly dashboard                    # Open web dashboard
```

### **Deployment:**
```bash
fly deploy                       # Deploy app
fly deploy --no-cache           # Deploy without cache
fly deploy --strategy immediate # Deploy immediately
```

### **Scaling:**
```bash
fly scale count 1               # Set VM count
fly scale memory 768            # Set memory (MB)
fly scale cpu 1                 # Set CPU count
```

### **Secrets:**
```bash
fly secrets list                # List secrets
fly secrets set KEY=value       # Set secret
fly secrets unset KEY           # Remove secret
```

### **SSH Access:**
```bash
fly ssh console                 # Open SSH console
fly ssh sftp                    # Open SFTP
```

### **Domains:**
```bash
fly certs add domain.com        # Add domain
fly certs list                  # List certificates
fly certs show domain.com       # Show certificate details
```

---

## ✦ **Troubleshooting** ✦

### **Deployment Issues:**
```bash
# Check logs
fly logs

# Check status
fly status

# Restart app
fly apps restart astraee-discord-bot
```

### **Database Connection Issues:**
```bash
# Access shell
fly ssh console

# Test database connection
node -e "console.log(process.env.DATABASE_URL)"

# Run database setup
npm run db:setup
```

### **Memory Issues:**
```bash
# Check memory usage
fly status

# Scale up memory
fly scale memory 1024
```

### **Domain Issues:**
```bash
# Check certificate status
fly certs show your-domain.com

# Check DNS
nslookup your-domain.com
```

---

## ✦ **Cost Comparison** ✦

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Render** | 750 hours/month | $7/month+ |
| **Fly.io** | 3 VMs, 160GB bandwidth | $1.94/month+ |
| **Railway** | $5 credit/month | $5/month+ |

**Fly.io is the most cost-effective option!**

---

## ✦ **Migration Checklist** ✦

- [ ] Install Fly.io CLI
- [ ] Create Fly.io account
- [ ] Login to Fly.io
- [ ] Create Fly.io app
- [ ] Configure fly.toml
- [ ] Create Dockerfile
- [ ] Set environment variables
- [ ] Deploy to Fly.io
- [ ] Set up database
- [ ] Configure custom domain
- [ ] Set up monitoring
- [ ] Test bot functionality
- [ ] Clean up Render (optional)

---

## ✦ **Next Steps After Migration** ✦

1. **Test all bot commands** in your Discord server
2. **Verify database connectivity** and table creation
3. **Set up UptimeRobot** for external monitoring
4. **Update your documentation** with new deployment info
5. **Share your success** with the community!

---

**Ready to migrate to Fly.io? Start with Step 1 and follow the guide!** ✦
