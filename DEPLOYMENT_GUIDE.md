# 🚀 Astraee Discord Bot - Cloud Deployment Guide

## ✦ Overview ✦

This guide covers deploying your Astraee Discord bot to various cloud platforms. The bot is optimized for JavaScript and includes enhanced slash commands with channel and user options.

## ✦ Enhanced Features ✦

### New Slash Commands Added:
- `/embed send` - Now requires channel selection
- `/streamcreate` - Optional channel parameter for posting logs
- `/activestreams` - Optional channel parameter for output
- `/completestream` - Optional channel parameter for completion logs
- `/streaminfo` - Get detailed information about a specific stream
- `/streamlist` - List streams with filters (status, model, channel)

### Web Server Integration:
- Express server for UptimeRobot keep-alive
- Responds with Astraee's elegant message
- Prevents platforms from sleeping due to inactivity

## ✦ Platform Comparison ✦

| Platform | Free Tier | Always-On | Database | Setup Difficulty | Recommendation |
|----------|-----------|-----------|----------|------------------|----------------|
| **Railway** | $5/month credit | ✅ Yes | ✅ PostgreSQL | ⭐ Easy | 🏆 **Best Choice** |
| **Render** | 750 hrs/month | ❌ Sleeps | ✅ PostgreSQL | ⭐ Easy | ⭐ Good |
| **Fly.io** | 3 VMs | ✅ Yes | ✅ PostgreSQL | ⭐⭐ Medium | ⭐ Good |
| **Replit** | Limited | ❌ Sleeps | ❌ External only | ⭐ Easy | ⚠️ Limited |
| **DigitalOcean** | $5/month credit | ✅ Yes | ✅ PostgreSQL | ⭐⭐ Medium | ⭐ Good |

## ✦ Recommended: Railway Deployment ✦

### Why Railway?
- ✅ **Always-on** - No sleeping, no UptimeRobot needed
- ✅ **PostgreSQL included** - No external database setup
- ✅ **Easy GitHub integration** - Auto-deploy on push
- ✅ **Generous free tier** - $5 credit monthly (usually sufficient)
- ✅ **Simple setup** - Just connect repo and deploy

### Railway Setup Steps:

#### 1. Prepare Your Repository
```bash
# Ensure all files are committed
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

#### 2. Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Astraee bot repository
5. Railway will automatically detect it's a Node.js project

#### 3. Add Environment Variables
In Railway dashboard, go to your project → Variables tab:
```
DISCORD_TOKEN=your_discord_bot_token_here
DATABASE_URL=railway_provides_this_automatically
NODE_ENV=production
```

#### 4. Deploy Database Schema
Railway provides a PostgreSQL database automatically. To set up tables:
1. Go to your project dashboard
2. Click on the database service
3. Copy the connection string
4. Set it as `DATABASE_URL` in your environment variables
5. The bot will create tables automatically on first run

#### 5. Deploy
Railway will automatically deploy your bot. Check the logs to ensure it starts successfully.

## ✦ Alternative: Render Deployment ✦

### Render Setup Steps:

#### 1. Prepare for Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository

#### 2. Configure Service
- **Name**: `astraee-discord-bot`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

#### 3. Add Environment Variables
```
DISCORD_TOKEN=your_discord_bot_token_here
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

#### 4. Add PostgreSQL Database
1. In Render dashboard, click "New" → "PostgreSQL"
2. Name it `astraee-db`
3. Copy the connection string
4. Set as `DATABASE_URL` in your web service

#### 5. Deploy
Click "Create Web Service" and wait for deployment.

#### 6. Set Up UptimeRobot (Required for Render)
Since Render sleeps after 15 minutes of inactivity:
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account
3. Add HTTP monitor:
   - **URL**: Your Render service URL
   - **Interval**: 5 minutes
   - **Name**: "Astraee Bot Keep-Alive"

## ✦ Alternative: Replit Deployment ✦

### Replit Setup Steps:

#### 1. Create Repl
1. Go to [replit.com](https://replit.com)
2. Sign in and click "Create Repl"
3. Choose "Node.js" template
4. Name it "astraee-discord-bot"

#### 2. Upload Files
Upload these files to your Repl:
- `index.js`
- `package.json`
- `server/db.js`
- `shared/schema.js`
- `drizzle.config.ts`

#### 3. Install Dependencies
In Repl shell:
```bash
npm install
```

#### 4. Set Up Secrets
In Repl, go to "Secrets" tab (🔑):
```
DISCORD_TOKEN=your_discord_bot_token_here
DATABASE_URL=your_postgresql_connection_string
```

#### 5. Set Up External Database
Since Replit doesn't provide databases:
1. Go to [neon.tech](https://neon.tech) (recommended)
2. Create free account and project
3. Copy connection string
4. Set as `DATABASE_URL` in Repl secrets

#### 6. Run Bot
Click "Run" button in Repl.

#### 7. Set Up UptimeRobot
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create HTTP monitor with your Repl's web URL
3. Set 5-minute intervals

## ✦ Environment Variables Reference ✦

### Required Variables:
```env
DISCORD_TOKEN=your_discord_bot_token_here
DATABASE_URL=your_postgresql_connection_string_here
```

### Optional Variables:
```env
NODE_ENV=production
PORT=3000
```

## ✦ Database Setup ✦

### For Railway/Render/Fly.io:
These platforms provide PostgreSQL automatically. Just use their connection string.

### For Replit:
Use external database services:
- **Neon** (recommended): [neon.tech](https://neon.tech) - Free tier available
- **Supabase**: [supabase.com](https://supabase.com) - Free tier available
- **PlanetScale**: [planetscale.com](https://planetscale.com) - Free tier available

### Database Schema:
The bot automatically creates these tables on first run:
- `users` - Discord user tracking
- `embed_templates` - Stored embed templates
- `streams` - IMVU stream records

## ✦ Bot Commands Reference ✦

### Embed Commands:
- `/embed create` - Create embed template
- `/embed list` - List all templates
- `/embed edit` - Edit existing template
- `/embed send` - Send template to specific channel

### Stream Commands:
- `/streamcreate` - Register new stream (with optional channel)
- `/activestreams` - View active streams (officer only, optional channel)
- `/completestream` - Mark stream complete (with optional channel)
- `/streaminfo` - Get detailed stream information
- `/streamlist` - List streams with filters

## ✦ Monitoring & Maintenance ✦

### Health Check Endpoint:
All deployments include a web server that responds to HTTP requests:
```
GET /
Response: "✦ Astraee is alive and serving with elegance ✦"
```

### UptimeRobot Setup (for platforms that sleep):
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create HTTP monitor
3. Set 5-minute intervals
4. Monitor your bot's web endpoint

### Log Monitoring:
- Check platform logs for errors
- Monitor Discord bot status (should be green)
- Verify slash commands are registered

## ✦ Troubleshooting ✦

### Bot Not Starting:
- ✅ Check environment variables are set correctly
- ✅ Verify Discord token is valid
- ✅ Ensure database connection string is correct
- ✅ Check platform logs for errors

### Commands Not Working:
- ✅ Wait 5-10 minutes for slash commands to sync
- ✅ Check bot has proper permissions in Discord
- ✅ Verify bot is online (green status)
- ✅ Try restarting the bot

### Database Errors:
- ✅ Run `npm run db:push` to create tables
- ✅ Check DATABASE_URL is correct
- ✅ Verify database service is running
- ✅ Check database connection limits

### Platform-Specific Issues:

#### Railway:
- Check if you've exceeded free tier limits
- Verify environment variables are set
- Check deployment logs

#### Render:
- Ensure UptimeRobot is configured
- Check if service is sleeping
- Verify database is connected

#### Replit:
- Check if Repl is running
- Verify secrets are set correctly
- Ensure external database is accessible

## ✦ Final Recommendations ✦

### For Production Use:
1. **Use Railway** - Best overall experience
2. **Set up monitoring** - Use UptimeRobot if needed
3. **Monitor logs** - Check for errors regularly
4. **Backup data** - Export database periodically

### For Development/Testing:
1. **Use Replit** - Quick setup for testing
2. **Use external database** - Neon or Supabase
3. **Set up UptimeRobot** - Keep bot alive

---

**Ready to deploy? Start with Railway for the best experience!** ✦

Your Astraee bot is now optimized for cloud deployment with enhanced slash commands and web server integration. Choose your platform and follow the setup steps above!
