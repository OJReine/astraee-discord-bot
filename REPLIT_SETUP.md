# Replit Configuration for Astraee Discord Bot

## ✦ Replit Setup Instructions ✦

### 1. Create New Repl
1. Go to [replit.com](https://replit.com) and sign in
2. Click "Create Repl" 
3. Choose "Node.js" template
4. Name it "astraee-discord-bot"

### 2. Upload Your Files
Upload these files to your Repl:
- `index.js` (main bot file)
- `package.json` (dependencies)
- `server/db.js` (database connection)
- `shared/schema.js` (database schema)
- `drizzle.config.ts` (database config)

### 3. Install Dependencies
In the Repl shell, run:
```bash
npm install
```

### 4. Set Up Secrets
In Replit, go to the "Secrets" tab (🔑 icon) and add:
- `DISCORD_TOKEN` - Your Discord bot token
- `DATABASE_URL` - Your PostgreSQL connection string

### 5. Add Web Server for UptimeRobot
Add this to the top of your `index.js`:

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('✦ Astraee is alive and serving with elegance ✦');
});

app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});
```

### 6. Install Express
```bash
npm install express
```

### 7. Set Up UptimeRobot
1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Sign up for free account
3. Create new HTTP monitor:
   - **URL**: Your Repl's web URL (found in Webview tab)
   - **Interval**: 5 minutes
   - **Name**: "Astraee Bot Keep-Alive"

## ✦ Better Hosting Alternatives ✦

### 🚀 Railway (Recommended)
- **Free Tier**: $5 credit monthly (usually enough for small bots)
- **Pros**: Easy deployment, PostgreSQL included, persistent storage
- **Setup**: Connect GitHub repo, auto-deploys on push
- **URL**: [railway.app](https://railway.app)

### 🌟 Render
- **Free Tier**: 750 hours/month, sleeps after 15min inactivity
- **Pros**: Easy setup, PostgreSQL available, good documentation
- **Cons**: Sleeps when inactive (use UptimeRobot)
- **URL**: [render.com](https://render.com)

### 🚁 Fly.io
- **Free Tier**: 3 small VMs, 256MB RAM each
- **Pros**: Always-on, good performance, Docker-based
- **Cons**: More complex setup
- **URL**: [fly.io](https://fly.io)

### ☁️ DigitalOcean App Platform
- **Free Tier**: $5 credit monthly
- **Pros**: Reliable, good performance, managed databases
- **Cons**: Limited free tier
- **URL**: [digitalocean.com](https://digitalocean.com)

## ✦ Recommended Setup: Railway ✦

Railway is the best option for your bot because:
- ✅ Always-on (no sleeping)
- ✅ PostgreSQL database included
- ✅ Easy GitHub integration
- ✅ Generous free tier
- ✅ No UptimeRobot needed

### Railway Setup Steps:
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project from GitHub repo
4. Add environment variables:
   - `DISCORD_TOKEN`
   - `DATABASE_URL` (Railway provides this)
5. Deploy automatically!

## ✦ Environment Variables for All Platforms ✦

```env
DISCORD_TOKEN=your_discord_bot_token_here
DATABASE_URL=your_postgresql_connection_string_here
NODE_ENV=production
```

## ✦ Database Setup ✦

### For Railway/Render/Fly.io:
These platforms provide PostgreSQL databases automatically.

### For Replit:
Use external database services:
- **Neon** (recommended): [neon.tech](https://neon.tech)
- **Supabase**: [supabase.com](https://supabase.com)
- **PlanetScale**: [planetscale.com](https://planetscale.com)

## ✦ Deployment Commands ✦

After setting up your chosen platform:

```bash
# Push database schema
npm run db:push

# Start the bot
npm start
```

## ✦ Monitoring & Maintenance ✦

### UptimeRobot Setup (for platforms that sleep):
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create HTTP monitor
3. Set 5-minute intervals
4. Monitor your bot's web endpoint

### Bot Health Check:
Your bot will respond to HTTP requests at the root path with:
```
✦ Astraee is alive and serving with elegance ✦
```

## ✦ Troubleshooting ✦

### Bot Not Starting:
- Check environment variables are set correctly
- Verify Discord token is valid
- Ensure database connection string is correct

### Commands Not Working:
- Wait 5-10 minutes for slash commands to sync
- Check bot has proper permissions in Discord
- Verify bot is online (green status)

### Database Errors:
- Run `npm run db:push` to create tables
- Check DATABASE_URL is correct
- Verify database service is running

---

**Recommendation**: Use **Railway** for the best experience - it's always-on, includes a database, and has excellent free tier limits! ✦
